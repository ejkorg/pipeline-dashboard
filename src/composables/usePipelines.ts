// DEPRECATED: Instead of importing usePipelines(), import and call usePipelinesStore() directly.
// Temporary alias retained for backward compatibility.
// Will be removed in a future release.
import { usePipelinesStore } from '@/stores/pipelines';

export function usePipelines() {
    if (import.meta.env.DEV) {
        // eslint-disable-next-line no-console
        console.warn('[deprecated] usePipelines() -> use usePipelinesStore()');
    }
    return usePipelinesStore();
}