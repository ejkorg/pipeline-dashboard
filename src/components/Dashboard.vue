<template>
  <div class="space-y-6">
  <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <div>
        <h2 class="text-xl font-semibold">Pipelines Overview</h2>
        <p class="text-xs text-gray-500 dark:text-gray-400">
          Source: {{ apiBase }}{{ apiPath }}
        </p>
        <p v-if="lastUpdated" class="text-[10px] text-gray-400">
          Updated: {{ lastUpdated.toLocaleTimeString() }}
        </p>
      </div>
      <div class="flex gap-2 items-center flex-wrap">
        <div class="flex items-end gap-2">
          <label class="text-xs flex flex-col">
            <span class="mb-1">Limit</span>
            <input type="number" min="0" v-model.number="apiLimit" class="px-2 py-2 text-sm border rounded w-24 dark:bg-gray-800 dark:border-gray-600" />
          </label>
          <label class="text-xs flex flex-col">
            <span class="mb-1">Offset</span>
            <input type="number" min="0" v-model.number="apiOffset" class="px-2 py-2 text-sm border rounded w-24 dark:bg-gray-800 dark:border-gray-600" />
          </label>
          <label class="text-xs inline-flex items-center gap-2 mb-1">
            <input type="checkbox" v-model="apiAllData" class="accent-indigo-600" />
            <span>all_data</span>
          </label>
          <button
            @click="load('manual')"
            :disabled="loading"
            class="px-3 py-2 rounded bg-indigo-600 text-white text-sm hover:bg-indigo-500 disabled:opacity-50"
            title="Apply query params and refresh"
          >Apply</button>
        </div>

        <button
          @click="load('manual')"
          :disabled="loading"
          class="px-3 py-2 rounded bg-indigo-600 text-white text-sm hover:bg-indigo-500 disabled:opacity-50"
        >
          {{ loading ? 'Refreshing...' : 'Refresh Now' }}
        </button>
        <button
          v-if="!offlineMode"
          class="px-3 py-2 rounded bg-amber-500 text-white text-sm hover:bg-amber-400"
          @click="enableOffline()"
        >Offline</button>
        <button
          v-else
          class="px-3 py-2 rounded bg-green-600 text-white text-sm hover:bg-green-500"
          @click="disableOffline()"
        >Go Live</button>
        <label class="text-xs flex flex-col">
          <span class="mb-1">Auto (s)</span>
          <select
            v-model.number="pollSeconds"
            class="px-2 py-2 text-sm border rounded dark:bg-gray-800 dark:border-gray-600"
          >
            <option :value="0">Off</option>
            <option :value="30">30</option>
            <option :value="60">60</option>
            <option :value="120">120</option>
            <option :value="300">300</option>
          </select>
        </label>
        <button
          class="px-3 py-2 rounded bg-gray-200 dark:bg-gray-700 text-sm"
          @click="exportJSON(pipelines)"
        >Export JSON</button>
        <button
          class="px-3 py-2 rounded bg-gray-200 dark:bg-gray-700 text-sm"
          @click="exportCSV(pipelines)"
        >Export CSV</button>
        <div class="text-xs flex flex-col">
          <span class="mb-1">Import JSON</span>
          <div class="flex items-center gap-2">
            <input type="file" accept="application/json" class="text-[10px]" @change="onUpload" />
            <label class="inline-flex items-center gap-1 cursor-pointer select-none">
              <input type="checkbox" v-model="mergeImport" class="accent-indigo-600" />
              <span class="text-[10px]">Merge</span>
            </label>
          </div>
        </div>
      </div>
    </div>

    <OfflineBanner :active="offlineMode" @disable="disableOffline" class="mt-1" />

    <div v-if="error" class="p-4 border border-red-300 bg-red-50 dark:bg-red-900/30 rounded text-sm flex items-center gap-3">
      <p class="font-semibold text-red-700 dark:text-red-300 flex-1">Error: {{ error }}</p>
      <button class="px-3 py-1 rounded bg-red-600 text-white text-xs" @click="retryFetch">Retry</button>
    </div>

    <div v-if="loading && !pipelines.length" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <div v-for="i in 4" :key="i" class="h-24 bg-gray-200 dark:bg-gray-700 animate-pulse rounded"></div>
    </div>

    <template v-else>
      <PipelineSummaryDashboard />
    </template>
  </div>
</template>

<script setup lang="ts">
import { defineAsyncComponent, onMounted, onBeforeUnmount, computed, ref } from 'vue';
import { storeToRefs } from 'pinia';
import { usePipelinesStore } from '@/stores/pipelines';
 // Removed unused import of PipelineDataSample
import { usePrefsStore } from '@/stores/prefs';
import { useToastsStore } from '@/stores/toasts';
import PipelineSummary from '@/components/PipelineSummary.vue';
import DetailsModal from '@/components/DetailsModal.vue';
import PipelineTable from '@/components/PipelineTable.vue';
import { exportJSON, exportCSV } from '@/utils/exporters';
import OfflineBanner from '@/components/OfflineBanner.vue';
import { pipelineData as bundledData } from '@/data.js';
import { normalizePipelines } from '@/utils/normalizePipeline';

const store = usePipelinesStore();
const prefs = usePrefsStore();
const toasts = useToastsStore();
const { pipelines, loading, error, pollSeconds, lastFetch } = storeToRefs(store);
const lastUpdated = computed(() => (lastFetch.value ? new Date(lastFetch.value) : null));
const selectedRun = ref<any | null>(null);
const selectedKeys = ref<string[]>([]);
const selectedKey = computed(() => selectedRun.value ? String(selectedRun.value.pid ?? `${selectedRun.value.start_utc}|${selectedRun.value.pipeline_name}`) : '');
const selectedRuns = computed(() => {
  const set = new Set(selectedKeys.value);
  return pipelines.value.filter(r => set.has(String(r.pid ?? `${r.start_utc}|${r.pipeline_name}`)));
});
const showModal = ref(false);
function onItemClick(run: any) {
  selectedRun.value = run;
  showModal.value = true;
}
function onSelectionChange(keys: string[]) {
  selectedKeys.value = keys;
  if (keys.length) {
    const first = pipelines.value.find(r => String(r.pid ?? `${r.start_utc}|${r.pipeline_name}`) === keys[0]);
    if (first) selectedRun.value = first;
  }
}
const load = (trigger: string = 'manual') => store.fetchPipelines(trigger);
const offlineMode = computed(() => prefs.offlineMode);
const mergeImport = ref(false);

function enableOffline() {
  prefs.setOffline(true);
  store.pipelines = normalizePipelines(bundledData.results as any);
  toasts.push('Offline mode: Using bundled sample data', { type: 'info' });
  store.stopPolling();
  store.disableRealtime();
}
function disableOffline() {
  prefs.setOffline(false);
  toasts.push('Live mode: Resuming API polling', { type: 'success' });
  load('manual');
  store.startPolling();
  store.enableRealtime();
}

function retryFetch() {
  toasts.push('Retrying fetch…', { type: 'info' });
  load('manual');
}

function uniqueMerge(existing: any[], incoming: any[]) {
  const map = new Map<string, any>();
  const keyOf = (r: any) => `${r.start_utc || ''}|${r.pipeline_name || ''}`;
  for (const r of existing) map.set(keyOf(r), r);
  for (const r of incoming) map.set(keyOf(r), r); // new overwrites
  return Array.from(map.values());
}

async function onUpload(e: Event) {
  const input = e.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;
  try {
    const text = await file.text();
    const json = JSON.parse(text);
    const list = Array.isArray(json) ? json : (json.results || []);
    let working = list as any[];
    if (mergeImport.value && prefs.offlineMode) {
      working = uniqueMerge(store.pipelines as any[], working);
    }
    const normalized = normalizePipelines(working as any);
    store.pipelines = normalized as any;
    prefs.setOffline(true);
    // Persist offline dataset (size guard ~1MB)
    const serialized = JSON.stringify({ results: working });
    if (serialized.length < 1_000_000) {
      localStorage.setItem('offline:dataset', serialized);
    } else {
  toasts.push('Import truncated: Dataset too large to persist locally', { type: 'warn' });
    }
  toasts.push(`Dataset imported: ${working.length} records loaded`, { type: 'success', timeoutMs: 4000 });
  } catch (err) {
  console.error('Failed to import JSON', err);
  toasts.push(`Import failed: ${(err as Error).message || 'Invalid JSON'}`, { type: 'error' });
  } finally {
    input.value = '';
  }
}

onMounted(() => {
  // Always use offline/mock data if VITE_USE_MOCK_DATA is true
  if (import.meta.env['VITE_USE_MOCK_DATA'] === 'true') {
    prefs.setOffline(true);
    // Use the dummy data from the API service
    load('manual');
    toasts.push('Mock mode: Using dummy pipeline data', { type: 'info' });
    store.stopPolling();
    store.disableRealtime();
    return;
  }
  if (offlineMode.value) {
    // Try restore persisted custom dataset first
    const persisted = localStorage.getItem('offline:dataset');
    if (persisted) {
      try {
        const parsed = JSON.parse(persisted);
        const list = Array.isArray(parsed) ? parsed : (parsed.results || []);
        store.pipelines = normalizePipelines(list as any);
        toasts.push(`Offline restored: ${list.length} records`, { type: 'info' });
      } catch {
        store.pipelines = normalizePipelines(bundledData.results as any);
      }
    } else {
      store.pipelines = normalizePipelines(bundledData.results as any);
    }
  } else {
    load('initial');
    store.startPolling();
    store.enableRealtime();
  }
});
onBeforeUnmount(() => {
  if (!offlineMode.value) {
    store.stopPolling();
    store.disableRealtime();
  }
});

const apiBase = import.meta.env.VITE_API_BASE_URL || '/pipeline-service';
const apiPath = computed(() => {
  const basePath = import.meta.env.VITE_API_ENDPOINT_PATH || '/get_pipeline_info?limit=10000&offset=0&all_data=true';
  const qIndex = basePath.indexOf('?');
  const path = qIndex >= 0 ? basePath.substring(0, qIndex) : basePath;
  const sp = new URLSearchParams(qIndex >= 0 ? basePath.substring(qIndex + 1) : '');
  sp.set('limit', String(prefs.apiLimit));
  sp.set('offset', String(prefs.apiOffset));
  sp.set('all_data', prefs.apiAllData ? 'true' : 'false');
  return `${path}?${sp.toString()}`;
});

// v-models for API params from prefs
const apiLimit = computed({ get: () => prefs.apiLimit, set: v => prefs.setApiLimit(v) });
const apiOffset = computed({ get: () => prefs.apiOffset, set: v => prefs.setApiOffset(v) });
const apiAllData = computed({ get: () => prefs.apiAllData, set: v => prefs.setApiAllData(v) });

const LazyPipelineDuration = defineAsyncComponent(() => import('./PipelineChart.vue'));
const LazyRowCount = defineAsyncComponent(() => import('./RowCountChart.vue'));
</script>