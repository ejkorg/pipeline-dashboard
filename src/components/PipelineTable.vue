<template>
  <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
      <div class="flex gap-2">
        <input
          type="text"
          v-model="searchTerm"
          placeholder="Search pipeline..."
          class="p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
          aria-label="Filter pipelines"
        />
        <select
          v-model="sortKey"
          class="p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
          aria-label="Sort key"
        >
          <option value="start_utc">Start Time</option>
            <option value="pipeline_name">Pipeline Name</option>
            <option value="elapsed_seconds">Duration</option>
            <option value="rowcount">Row Count</option>
        </select>
        <button
          @click="toggleOrder"
          class="px-3 py-2 border rounded dark:border-gray-600 dark:bg-gray-700 text-xs"
          aria-label="Toggle sort order"
        >
          {{ sortOrder.toUpperCase() }}
        </button>
      </div>
      <div class="flex items-center gap-3 text-xs">
        <label>
          Page Size
          <select v-model.number="pageSize" class="ml-1 p-1 border rounded dark:bg-gray-700 dark:border-gray-600">
            <option :value="25">25</option>
            <option :value="50">50</option>
            <option :value="100">100</option>
          </select>
        </label>
        <div class="flex gap-1">
          <button
            class="px-2 py-1 border rounded disabled:opacity-30"
            :disabled="page === 1"
            @click="page--"
          >&lt;</button>
          <span class="px-2 py-1">{{ page }}</span>
          <button
            class="px-2 py-1 border rounded disabled:opacity-30"
            :disabled="endIndex >= sorted.length"
            @click="page++"
          >&gt;</button>
        </div>
      </div>
    </div>

    <div class="overflow-x-auto max-h-[560px]">
      <table class="w-full text-sm" role="table" aria-label="Pipeline runs">
        <thead
          class="text-xs uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-300 sticky top-0"
        >
          <tr role="row">
            <th class="py-3 px-4 text-left">Name</th>
            <th class="py-3 px-4 text-left">Start UTC</th>
            <th class="py-3 px-4 text-left">Duration</th>
            <th class="py-3 px-4 text-left">Rows</th>
            <th class="py-3 px-4 text-left">Trend</th>
            <th class="py-3 px-4 text-left">Env</th>
            <th class="py-3 px-4 text-left">Status</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="p in paged"
            :key="p.pid ?? p.start_utc + p.pipeline_name"
            class="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
            role="row"
          >
            <td class="py-3 px-4 font-medium">
              {{ p.pipeline_name }}
            </td>
            <td class="py-3 px-4">
              {{ formatDate(p.start_utc) }}
            </td>
            <td class="py-3 px-4">
              {{ p.elapsed_human || (p.elapsed_seconds + 's') }}
            </td>
            <td class="py-3 px-4">
              {{ p.rowcount.toLocaleString() }}
            </td>
            <td class="py-3 px-4">
              <span
                :class="[
                  'text-xs font-semibold',
                  p.trend === 'up' && 'text-red-500',
                  p.trend === 'down' && 'text-green-500',
                  p.trend === 'flat' && 'text-gray-400'
                ]"
              >
                <span v-if="p.trend === 'up'">▲</span>
                <span v-else-if="p.trend === 'down'">▼</span>
                <span v-else>▬</span>
              </span>
            </td>
            <td class="py-3 px-4">
              <span
                :class="[
                  'px-2 inline-flex text-xs leading-5 font-semibold rounded-full',
                  p.environment === 'prod'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-indigo-100 text-indigo-800'
                ]"
              >
                {{ p.environment || 'N/A' }}
              </span>
            </td>
            <td class="py-3 px-4">
              <span
                :class="[
                  'px-2 py-1 text-xs rounded',
                  p.status === 'success' && 'bg-green-600 text-white',
                  p.status === 'failed' && 'bg-red-600 text-white',
                  (!p.status || p.status === 'running') && 'bg-gray-400 text-white'
                ]"
              >
                {{ p.status || 'unknown' }}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
      <div v-if="!paged.length" class="text-center text-xs text-gray-500 dark:text-gray-400 p-4">
        No matches.
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { PipelineRun } from '@/types/pipeline';
import { ref, computed, watch } from 'vue';
import { useLocalStorage } from '@/composables/useLocalStorage';

const props = defineProps<{ pipelines: PipelineRun[] }>();

const searchTerm = useLocalStorage<string>('filters:search', '');
const sortKey = useLocalStorage<'pipeline_name' | 'start_utc' | 'elapsed_seconds' | 'rowcount'>(
  'filters:sortKey',
  'start_utc'
);
const sortOrder = useLocalStorage<'asc' | 'desc'>('filters:sortOrder', 'desc');
const pageSize = useLocalStorage<number>('filters:pageSize', 50);
const page = ref(1);

watch([searchTerm, sortKey, sortOrder, pageSize], () => {
  page.value = 1;
});

function toggleOrder() {
  sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc';
}

const filtered = computed(() => {
  if (!searchTerm.value) return props.pipelines;
  const term = searchTerm.value.toLowerCase();
  return props.pipelines.filter(p => p.pipeline_name.toLowerCase().includes(term));
});

const sorted = computed(() => {
  const dir = sortOrder.value === 'asc' ? 1 : -1;
  return [...filtered.value].sort((a, b) => {
    let av: number | string = a[sortKey.value];
    let bv: number | string = b[sortKey.value];
    if (sortKey.value === 'start_utc') {
      av = new Date(String(av)).getTime();
      bv = new Date(String(bv)).getTime();
    }
    return av < bv ? -1 * dir : av > bv ? 1 * dir : 0;
  });
});

const startIndex = computed(() => (page.value - 1) * pageSize.value);
const endIndex = computed(() => startIndex.value + pageSize.value);
const paged = computed(() => sorted.value.slice(startIndex.value, endIndex.value));

function formatDate(iso: string) {
  return new Date(iso).toISOString().replace('T', ' ').slice(0, 19);
}
</script>