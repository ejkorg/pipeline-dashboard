import { computed, ref, watch } from 'vue';
import type { PipelineRun } from '@/types/pipeline';
import { usePrefsStore } from '@/stores/prefs';

// Centralized filtering / sorting / pagination logic tied to prefs store.
export function usePipelineFilters(source: () => PipelineRun[]) {
  const prefs = usePrefsStore();

  const page = ref(1); // local page state only
  const pageSize = computed({ get: () => prefs.tablePageSize, set: v => prefs.setPageSize(v) });
  const search = computed({ get: () => prefs.search, set: v => prefs.setSearch(v) });
  const sortKey = computed({ get: () => prefs.sortKey, set: v => prefs.setSort(v, prefs.sortOrder) });
  const sortOrder = computed({ get: () => prefs.sortOrder, set: v => prefs.setSort(prefs.sortKey, v) });

  function toggleOrder() {
    prefs.setSort(prefs.sortKey, prefs.sortOrder === 'asc' ? 'desc' : 'asc');
  }

  watch([search, sortKey, sortOrder, pageSize], () => { page.value = 1; });

  const filtered = computed(() => {
    const list = source();
    if (!search.value) return list;
    const term = search.value.toLowerCase();
    return list.filter(p => p.pipeline_name.toLowerCase().includes(term));
  });

  const sorted = computed(() => {
    const dir = sortOrder.value === 'asc' ? 1 : -1;
    return [...filtered.value].sort((a, b) => {
      let av: number | string = (a as any)[sortKey.value];
      let bv: number | string = (b as any)[sortKey.value];
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

  return { page, pageSize, search, sortKey, sortOrder, toggleOrder, filtered, sorted, paged, startIndex, endIndex };
}
