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

    <div
      class="overflow-x-auto max-h-[560px] outline-none"
      tabindex="0"
      @keydown.stop.prevent="onKeydown"
      @focus="hasFocus = true"
      @blur="hasFocus = false"
    >
      <table class="w-full text-sm" role="table" aria-label="Pipeline runs">
        <thead
          class="text-xs uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-300 sticky top-0"
        >
          <tr role="row">
            <th class="py-3 px-4 text-left">Name</th>
            <th class="py-3 px-4 text-left">Start UTC</th>
            <th class="py-3 px-4 text-left">End UTC</th>
            <th class="py-3 px-4 text-left">Duration</th>
            <th class="py-3 px-4 text-left">Trend</th>
            <th class="py-3 px-4 text-left">Env</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(p, idx) in paged"
            :key="rowKey(p)"
            :data-key="rowKey(p)"
            class="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 cursor-pointer"
            :class="[
              isSelected(p) && 'bg-indigo-50 dark:bg-indigo-900/30',
              hasFocus && focusIndex === idx && 'ring-2 ring-indigo-400'
            ]"
            role="row"
            @click="onRowClick($event, p, idx)"
          >
            <td class="py-3 px-4 font-medium">
              {{ p.pipeline_name }}
            </td>
            <td class="py-3 px-4">
              {{ formatDate(p.start_utc) }}
            </td>
            <td class="py-3 px-4">
              {{ formatDate(p.end_utc) }}
            </td>
            <td class="py-3 px-4">
              {{ p.elapsed_human || (p.elapsed_seconds + 's') }}
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

const emit = defineEmits<{
  (e: 'item-click', run: PipelineRun): void;
  (e: 'selection-change', keys: string[]): void;
}>();

const props = defineProps<{
  pipelines: PipelineRun[];
  selectedKey?: string; // legacy single-select
  selectedKeys?: string[]; // multi-select
}>();
const { page, pageSize, search, sortKey, sortOrder, toggleOrder, paged, sorted, endIndex } =
  usePipelineFilters(() => props.pipelines);

// alias for template binding name consistency
const pageSizeProxy = pageSize;
const prefs = usePrefsStore();
const offlineMode = computed(() => prefs.offlineMode);

// Debug logging
console.log('📋 PipelineTable Debug:', {
  receivedPipelinesCount: props.pipelines.length,
  pageSize: pageSize.value,
  currentPage: page.value,
  searchTerm: search.value,
  pagedResultsCount: paged.value.length,
  totalSortedCount: sorted.value.length
});

// Debug helper - can be called from browser console
if (typeof window !== 'undefined') {
  (window as any).debugPipelineTable = () => {
    console.log('🔍 PipelineTable Debug Info:');
    console.log('  Total pipelines received:', props.pipelines.length);
    console.log('  Current page:', page.value);
    console.log('  Page size:', pageSize.value);
    console.log('  Search term:', search.value);
    console.log('  Paged results:', paged.value.length);
    console.log('  Total sorted:', sorted.value.length);
    console.log('  Sample data:', props.pipelines.slice(0, 3));
    return {
      totalReceived: props.pipelines.length,
      pageSize: pageSize.value,
      currentPage: page.value,
      displayed: paged.value.length,
      search: search.value
    };
  };
}

function formatDate(iso?: string) {
  if (!iso) return 'N/A';
  return new Date(iso).toISOString().replace('T', ' ').slice(0, 19);
}

// Selection helpers
import { ref } from 'vue';
const hasFocus = ref(false);
const focusIndex = ref<number>(-1);

function rowKey(p: PipelineRun): string {
  return String(p.pid ?? `${p.start_utc}|${p.pipeline_name}`);
}
function isSelected(p: PipelineRun): boolean {
  const key = rowKey(p);
  if (props.selectedKeys && props.selectedKeys.length) {
    return props.selectedKeys.includes(key);
  }
  return props.selectedKey ? key === props.selectedKey : false;
}
function onRowClick(evt: MouseEvent, p: PipelineRun, idx: number) {
  const key = rowKey(p);
  focusIndex.value = idx;
  const multi = evt.ctrlKey || evt.metaKey;
  const range = evt.shiftKey;
  if (!props.selectedKeys && !multi && !range) {
    emit('item-click', p);
    return;
  }
  let next: string[] = Array.isArray(props.selectedKeys) ? [...props.selectedKeys] : (props.selectedKey ? [props.selectedKey] : []);
  if (range && focusIndex.value >= 0) {
    // range select from nearest selected or start
    const start = Math.min(focusIndex.value, idx);
    const end = Math.max(focusIndex.value, idx);
    const pageKeys = (props.pipelines || []).slice(0).filter(x => true); // noop keep type
    const keysInRange = (paged as any as PipelineRun[]).slice(start, end + 1).map(rowKey);
    const set = new Set(next);
    keysInRange.forEach(k => set.add(k));
    next = Array.from(set);
  } else if (multi) {
    if (next.includes(key)) next = next.filter(k => k !== key);
    else next.push(key);
  } else {
    next = [key];
  }
  emit('selection-change', next);
}

function onKeydown(e: KeyboardEvent) {
  const max = (paged as any as PipelineRun[]).length - 1;
  if (max < 0) return;
  if (focusIndex.value < 0) focusIndex.value = 0;
  if (e.key === 'ArrowDown') {
    focusIndex.value = Math.min(max, focusIndex.value + 1);
  } else if (e.key === 'ArrowUp') {
    focusIndex.value = Math.max(0, focusIndex.value - 1);
  } else if (e.key === 'Home') {
    focusIndex.value = 0;
  } else if (e.key === 'End') {
    focusIndex.value = max;
  } else if (e.key === 'Enter' || e.key === ' ') {
    const item = (paged as any as PipelineRun[])[focusIndex.value];
    if (item) onRowClick(new MouseEvent('click'), item, focusIndex.value);
  }
}
</script>