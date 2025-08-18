import { describe, it, expect, vi, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { usePipelinesStore } from '@/stores/pipelines';
import * as api from '@/services/pipelineApi';

describe('pipelines store', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('fetches pipelines and populates state', async () => {
    const spy = vi.spyOn(api, 'getPipelineInfo').mockResolvedValue([
      { start_utc: '2024-01-01T00:00:00Z', pipeline_name: 'a', elapsed_seconds: 1, rowcount: 1 }
    ] as any);
    const store = usePipelinesStore();
    await store.fetchPipelines();
    expect(store.pipelines.length).toBe(1);
    expect(store.total).toBe(1);
    spy.mockRestore();
  });

  it('sets error on failure', async () => {
    const spy = vi.spyOn(api, 'getPipelineInfo').mockRejectedValue(new Error('fail'));
    const store = usePipelinesStore();
    await store.fetchPipelines();
    expect(store.error).toBe('fail');
    spy.mockRestore();
  });
});
