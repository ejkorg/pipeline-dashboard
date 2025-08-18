import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import { getPipelineInfo } from '@/services/pipelineApi';
import { connectRealtime, disconnectRealtime, onRealtime } from '@/services/realtime';
import type { PipelineRun } from '@/types/pipeline';
import { logger } from '@/utils/logger';
import { useLocalStorage } from './useLocalStorage';

export function usePipelines() {
    const pipelines = ref<PipelineRun[]>([]);
    const loading = ref(false);
    const error = ref<Error | null>(null);
    const pollSeconds = useLocalStorage<number>('pipelines:pollSeconds', Number(import.meta.env.VITE_API_POLL_SECONDS) || 60);
    let pollTimer: number | null = null;
    const lastUpdated = ref<Date | null>(null);

    async function load(trigger = 'manual') {
        loading.value = true;
        try {
            const data = await getPipelineInfo();
            pipelines.value = data;
            lastUpdated.value = new Date();
            if (trigger !== 'realtime') logger.info(`Pipelines updated (${trigger})`);
        } catch (e) {
            error.value = e instanceof Error ? e : new Error(String(e));
        } finally {
            loading.value = false;
        }
    }

    function startPolling() {
        stopPolling();
        if (pollSeconds.value > 0) {
            pollTimer = window.setInterval(() => load('poll'), pollSeconds.value * 1000);
        }
    }

    function stopPolling() {
        if (pollTimer) {
            clearInterval(pollTimer);
            pollTimer = null;
        }
    }

    const realtimeMode = import.meta.env.VITE_REALTIME || 'poll';
    if (realtimeMode === 'ws' || realtimeMode === 'sse') {
        const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:8001';
        connectRealtime(realtimeMode, wsUrl, import.meta.env.VITE_API_TOKEN);
        onRealtime(updates => {
            pipelines.value = updates.concat(pipelines.value).slice(0); // simplistic merge
            lastUpdated.value = new Date();
        });
    }

    onMounted(() => {
        load('initial');
        if (realtimeMode === 'poll') startPolling();
    });
    onBeforeUnmount(() => {
        stopPolling();
        disconnectRealtime();
    });

    const stats = computed(() => {
        const total = pipelines.value.length;
        const totalDuration = pipelines.value.reduce((a, p) => a + p.elapsed_seconds, 0);
        const avgDuration = total ? totalDuration / total : 0;
        const totalRows = pipelines.value.reduce((a, p) => a + p.rowcount, 0);
        return {
            total,
            avgDuration,
            totalRows
        };
    });

    return {
        pipelines,
        loading,
        error,
        load,
        pollSeconds,
        lastUpdated,
        stats
    };
}