import { defineStore } from 'pinia';
import { ref, watch } from 'vue';

// UI / user preference store (persisted in localStorage)
export const usePrefsStore = defineStore('prefs', () => {
  // Dark mode initialization: prefer explicit stored value; fall back to legacy key; then system preference
  function prefersDark(): boolean {
    return typeof window !== 'undefined' && window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)').matches : false;
  }
  const stored = localStorage.getItem('ui:darkMode');
  const legacy = localStorage.getItem('app:dark'); // previous key used by DarkModeToggle
  const initialDark = stored != null ? stored === 'true' : legacy != null ? legacy === 'true' : prefersDark();
  const darkMode = ref(initialDark);
  const tablePageSize = ref<number>(Number(localStorage.getItem('ui:tablePageSize')) || 50);
  const sortKey = ref<string>(localStorage.getItem('ui:sortKey') || 'start_utc');
  const sortOrder = ref<'asc' | 'desc'>((localStorage.getItem('ui:sortOrder') as any) || 'desc');
  const search = ref<string>(localStorage.getItem('ui:search') || '');
  // Offline mode: do NOT persist by default; start live unless env forces offline.
  const offlineMode = ref(import.meta.env['VITE_OFFLINE_MODE'] === 'true');

  function toggleDark() { darkMode.value = !darkMode.value; }
  function setPageSize(n: number) { tablePageSize.value = n; }
  function setSort(k: string, order: 'asc' | 'desc') { sortKey.value = k; sortOrder.value = order; }
  function setSearch(q: string) { search.value = q; }
  function toggleOffline() { offlineMode.value = !offlineMode.value; }
  function setOffline(v: boolean) { offlineMode.value = v; }

  // persistence
  watch(darkMode, v => localStorage.setItem('ui:darkMode', String(v)));
  watch(tablePageSize, v => localStorage.setItem('ui:tablePageSize', String(v)));
  watch(sortKey, v => localStorage.setItem('ui:sortKey', v));
  watch(sortOrder, v => localStorage.setItem('ui:sortOrder', v));
  watch(search, v => localStorage.setItem('ui:search', v));
  // Intentionally not persisting offlineMode so app always defaults to live data on reload
  return { darkMode, tablePageSize, sortKey, sortOrder, search, offlineMode, toggleDark, setPageSize, setSort, setSearch, toggleOffline, setOffline };
});
