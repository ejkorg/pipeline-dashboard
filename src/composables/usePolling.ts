import { ref, onUnmounted, watch, getCurrentInstance } from 'vue';

export interface UsePollingOptions {
  immediate?: boolean; // run once immediately
  enabled?: () => boolean; // dynamic gate
}

export function usePolling(callback: () => void | Promise<void>, intervalMsRef: () => number, opts: UsePollingOptions = {}) {
  const running = ref(false);
  let timer: number | null = null;

  async function tick() {
    try {
      await callback();
    } catch {
      // swallow; let caller log
    }
  }

  function schedule() {
    clearTimer();
    const ms = intervalMsRef();
    if (ms > 0 && (!opts.enabled || opts.enabled())) {
      timer = window.setInterval(() => tick(), ms);
      running.value = true;
    } else {
      running.value = false;
    }
  }

  function start() {
    schedule();
    if (opts.immediate) void tick();
  }

  function stop() {
    clearTimer();
    running.value = false;
  }

  function clearTimer() {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
  }

  watch(intervalMsRef, () => {
    if (running.value) schedule();
  });

  // Only register lifecycle hook if inside component context (suppresses test warnings)
  if (getCurrentInstance()) onUnmounted(stop);

  return { start, stop, running };
}
