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

  // API query parameter controls
  function defaultsFromEnv() {
  const path = import.meta.env['VITE_API_ENDPOINT_PATH'] || '/get_pipeline_info'; // clean fallback
    const qIndex = path.indexOf('?');
    const query = qIndex >= 0 ? path.substring(qIndex + 1) : '';
    const sp = new URLSearchParams(query);
    const limit = Number(sp.get('limit') || '100') || 100;
    const offset = Number(sp.get('offset') || '0') || 0;
    const allData = (sp.get('all_data') || 'false').toLowerCase() === 'true';
    return { limit, offset, allData };
  }
  const envDefaults = defaultsFromEnv();
  const apiLimit = ref<number>(Number(localStorage.getItem('api:limit')) || envDefaults.limit);
  const apiOffset = ref<number>(Number(localStorage.getItem('api:offset')) || envDefaults.offset);
  const apiAllData = ref<boolean>((localStorage.getItem('api:allData') || String(envDefaults.allData)) === 'true');

  function toggleDark() { darkMode.value = !darkMode.value; }
  function setPageSize(n: number) { tablePageSize.value = n; }
  function setSort(k: string, order: 'asc' | 'desc') { sortKey.value = k; sortOrder.value = order; }
  function setSearch(q: string) { search.value = q; }
  function toggleOffline() { offlineMode.value = !offlineMode.value; }
  function setOffline(v: boolean) { offlineMode.value = v; }
  function setApiLimit(n: number) { apiLimit.value = Math.max(0, Math.floor(n || 0)); }
  function setApiOffset(n: number) { apiOffset.value = Math.max(0, Math.floor(n || 0)); }
  function setApiAllData(v: boolean) { apiAllData.value = !!v; }

  // persistence
  watch(darkMode, v => localStorage.setItem('ui:darkMode', String(v)));
  watch(tablePageSize, v => localStorage.setItem('ui:tablePageSize', String(v)));
  watch(sortKey, v => localStorage.setItem('ui:sortKey', v));
  watch(sortOrder, v => localStorage.setItem('ui:sortOrder', v));
  watch(search, v => localStorage.setItem('ui:search', v));
  // Intentionally not persisting offlineMode so app always defaults to live data on reload
  watch(apiLimit, v => localStorage.setItem('api:limit', String(v)));
  watch(apiOffset, v => localStorage.setItem('api:offset', String(v)));
  watch(apiAllData, v => localStorage.setItem('api:allData', String(v)));
  return { darkMode, tablePageSize, sortKey, sortOrder, search, offlineMode, apiLimit, apiOffset, apiAllData, toggleDark, setPageSize, setSort, setSearch, toggleOffline, setOffline, setApiLimit, setApiOffset, setApiAllData };
});
