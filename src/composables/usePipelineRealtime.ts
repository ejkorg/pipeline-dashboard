import { connectRealtime, disconnectRealtime, onRealtime } from '@/services/realtime';
import type { PipelineRun } from '@/types/pipeline';

export function usePipelineRealtime() {
  let unsub: (() => void) | null = null;
  let active = false;

  function enable(merge: (updates: PipelineRun[]) => void) {
    if (active) return;
    const mode = import.meta.env.VITE_REALTIME || 'poll';
    if (mode === 'poll') return; // nothing to do
    const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:8001';
    connectRealtime(mode, wsUrl, import.meta.env.VITE_API_TOKEN);
    unsub = onRealtime(merge);
    active = true;
  }

  function disable() {
    unsub?.();
    unsub = null;
    disconnectRealtime();
    active = false;
  }

  return { enable, disable };
}
