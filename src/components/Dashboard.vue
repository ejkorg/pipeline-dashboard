<template>
  <div class="space-y-6">
    <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <div>
        <h2 class="text-xl font-semibold">Pipelines Overview</h2>
        <p class="text-xs text-gray-500 dark:text-gray-400">
          Source: {{ apiBase }}/get_pipeline_info
        </p>
        <p v-if="lastUpdated" class="text-[10px] text-gray-400">
          Updated: {{ lastUpdated.toLocaleTimeString() }}
        </p>
      </div>
      <div class="flex gap-2 items-center flex-wrap">
        <button
          @click="load('manual')"
          :disabled="loading"
          class="px-3 py-2 rounded bg-indigo-600 text-white text-sm hover:bg-indigo-500 disabled:opacity-50"
        >
          {{ loading ? 'Refreshing...' : 'Refresh Now' }}
        </button>
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
      </div>
    </div>

    <div v-if="error" class="p-4 border border-red-300 bg-red-50 dark:bg-red-900/30 rounded text-sm">
      <p class="font-semibold text-red-700 dark:text-red-300">Error: {{ error.message }}</p>
    </div>

    <div v-if="loading && !pipelines.length" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <div v-for="i in 4" :key="i" class="h-24 bg-gray-200 dark:bg-gray-700 animate-pulse rounded"></div>
    </div>

    <template v-else>
      <PipelineSummary :pipelines="pipelines" />
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Suspense>
          <template #default>
            <LazyPipelineDuration :pipelines="pipelines" />
          </template>
          <template #fallback>
            <div class="h-[360px] bg-gray-200 dark:bg-gray-700 animate-pulse rounded"></div>
          </template>
        </Suspense>
        <Suspense>
          <template #default>
            <LazyRowCount :pipelines="pipelines" />
          </template>
          <template #fallback>
            <div class="h-[360px] bg-gray-200 dark:bg-gray-700 animate-pulse rounded"></div>
          </template>
        </Suspense>
      </div>
      <PipelineTable :pipelines="pipelines" />
    </template>
  </div>
</template>

<script setup lang="ts">
import { defineAsyncComponent } from 'vue';
import { usePipelines } from '@/composables/usePipelines';
import PipelineSummary from '@/components/PipelineSummary.vue';
import PipelineTable from '@/components/PipelineTable.vue';
import { exportJSON, exportCSV } from '@/utils/exporters';

const {
  pipelines,
  loading,
  error,
  load,
  pollSeconds,
  lastUpdated
} = usePipelines();

const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://10.253.112.87:8001';

const LazyPipelineDuration = defineAsyncComponent(() => import('./PipelineChart.vue'));
const LazyRowCount = defineAsyncComponent(() => import('./RowCountChart.vue'));
</script>