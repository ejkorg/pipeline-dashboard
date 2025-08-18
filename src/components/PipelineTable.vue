<template>
  <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
    <div v-if="offlineMode" class="mb-3">
      <span class="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-semibold rounded-full bg-amber-200 text-amber-900 dark:bg-amber-800 dark:text-amber-100">
        OFFLINE DATA
      </span>
    </div>
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
      <div class="flex gap-2">
        <input
          type="text"
          v-model="search"
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
          <select v-model.number="pageSizeProxy" class="ml-1 p-1 border rounded dark:bg-gray-700 dark:border-gray-600">
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
              <span :class="['px-2 py-1 text-xs rounded font-semibold', statusClass(p)]">
                {{ displayStatus(p) }}
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
import { usePipelineFilters } from '@/composables/usePipelineFilters';
import { usePrefsStore } from '@/stores/prefs';
import { computed } from 'vue';

const props = defineProps<{ pipelines: PipelineRun[] }>();
const { page, pageSize, search, sortKey, sortOrder, toggleOrder, paged, sorted, endIndex } =
  usePipelineFilters(() => props.pipelines);

// alias for template binding name consistency
const pageSizeProxy = pageSize;
const prefs = usePrefsStore();
const offlineMode = computed(() => prefs.offlineMode);

function formatDate(iso: string) {
  return new Date(iso).toISOString().replace('T', ' ').slice(0, 19);
}

// Derive a user-friendly status when backend does not supply one.
// Precedence:
// 1. Explicit p.status
// 2. end_utc present => Completed
// 3. start_utc present (no end) => Running
// 4. Otherwise => Unknown
function displayStatus(p: PipelineRun): string {
  if (p.status && p.status.trim().length) return p.status.toLowerCase();
  if (p.end_utc) return 'Completed';
  if (p.start_utc) return 'Running';
  return 'Unknown';
}

function statusClass(p: PipelineRun): string {
  const s = displayStatus(p).toLowerCase();
  switch (s) {
    case 'success':
    case 'completed':
      return 'bg-green-600 text-white';
    case 'failed':
    case 'error':
      return 'bg-red-600 text-white';
    case 'running':
      return 'bg-blue-600 text-white';
    case 'unknown':
    default:
      return 'bg-gray-400 text-white';
  }
}
</script>