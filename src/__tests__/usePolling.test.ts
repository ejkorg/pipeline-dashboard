import { describe, it, expect, vi } from 'vitest';
import { nextTick } from 'vue';
import { usePolling } from '@/composables/usePolling';

describe('usePolling', () => {
  it('polls at interval and can stop', async () => {
    vi.useFakeTimers();
    const fn = vi.fn();
    const interval = () => 1000;
    const p = usePolling(fn, interval, { immediate: true });
    p.start();
    expect(fn).toHaveBeenCalledTimes(1); // immediate call
    vi.advanceTimersByTime(3000);
    await nextTick();
    expect(fn).toHaveBeenCalledTimes(4); // 1 immediate + 3 ticks
    p.stop();
    vi.advanceTimersByTime(2000);
    expect(fn).toHaveBeenCalledTimes(4); // no more after stop
    vi.useRealTimers();
  });
});
