import { defineStore } from 'pinia';
import { ref, computed, watch, onUnmounted, getCurrentInstance } from 'vue';
import { getPipelineInfo, onPipelineSource } from '../services/pipelineApi';
import { usePrefsStore } from './prefs';
import type { PipelineRun } from '../types/pipeline';
import { logger } from '../utils/logger';
import { normalizePipelines } from '../utils/normalizePipeline';
import { usePolling } from '../composables/usePolling';
import { usePipelineRealtime } from '../composables/usePipelineRealtime';

function normalize(record: PipelineRun): PipelineRun {
  // Placeholder for future normalization (null -> undefined, etc.)
  return { ...record };
}

export const usePipelinesStore = defineStore('pipelines', () => {
  const pipelines = ref<PipelineRun[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const lastFetch = ref<number | null>(null);
  const lastFetchSource = ref<'live' | 'offline' | 'fallback' | null>(null);
  const pollSeconds = ref<number>(
    Number(localStorage.getItem('pipelines:pollSeconds')) ||
      Number(import.meta.env.VITE_API_POLL_SECONDS) ||
      60
  );

  const prefs = usePrefsStore();
  const realtime = usePipelineRealtime();
  const polling = usePolling(() => fetchPipelines('poll'), () => pollSeconds.value * 1000);

  async function fetchPipelines(trigger: string = 'manual') {
    loading.value = true;
    error.value = null;
    try {
      const list = await getPipelineInfo(false, {
        limit: prefs.apiLimit,
        offset: prefs.apiOffset,
        all_data: prefs.apiAllData,
      } as any);
      pipelines.value = normalizePipelines(list);
      lastFetch.value = Date.now();
  if (error.value) error.value = null;
  // Source will already have been set by API layer via callback (to implement) else default to live
  if (!lastFetchSource.value) lastFetchSource.value = 'live';
      if (trigger !== 'realtime') logger.info(`Pipelines updated (${trigger})`);
    } catch (e: any) {
      error.value = e?.message || 'Fetch failed';
      logger.error('pipelines.fetch.error', e);
    } finally {
      loading.value = false;
    }
  }

  function startPolling() { polling.start(); }
  function stopPolling() { polling.stop(); }
  function enableRealtime() { realtime.enable(updates => { pipelines.value = updates.concat(pipelines.value); lastFetch.value = Date.now(); }); }
  function disableRealtime() { realtime.disable(); }

  // Derived
  const total = computed(() => pipelines.value.length);
  const totalDuration = computed(() => pipelines.value.reduce((a: number, p: PipelineRun) => a + p.elapsed_seconds, 0));
  const avgDuration = computed(() => (total.value ? totalDuration.value / total.value : 0));
  const totalRows = computed(() => pipelines.value.reduce((a: number, p: PipelineRun) => a + p.rowcount, 0));

  watch(pollSeconds, v => {
    localStorage.setItem('pipelines:pollSeconds', String(v));
    if (polling.running.value) startPolling();
  });

  if (getCurrentInstance()) {
    onUnmounted(() => {
      stopPolling();
      disableRealtime();
    });
  }

  // Listen for API source events
  onPipelineSource(src => { lastFetchSource.value = src; });

  const api = {
    pipelines,
    loading,
    error,
    lastFetch,
    lastFetchSource,
    pollSeconds,
    total,
    avgDuration,
    totalRows,
    fetchPipelines,
    startPolling,
    stopPolling,
    enableRealtime,
    disableRealtime
  };
  return api;
});

export type PipelinesStore = ReturnType<typeof usePipelinesStore>;
