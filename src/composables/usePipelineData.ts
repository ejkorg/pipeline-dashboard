import { ref } from 'vue';
import { getPipelineInfo } from '@/services/pipelineApi';
import type { PipelineRun } from '@/types/pipeline';

export function usePipelineData() {
  const data = ref<PipelineRun[]>([]);
  const total = ref(0);
  const pipelines = ref<PipelineRun[]>([]);
  const loading = ref(false);
  const limitClamped = ref(false);
  const clampedLimit = ref<number | null>(null);

  async function fetchPipelines(limit: number = 100, offset: number = 0, allData: boolean = true) {
    loading.value = true;
    limitClamped.value = false;
    clampedLimit.value = null;

    try {
      // Store the original requested limit for comparison
      const originalLimit = limit;

      // Fetch data using the centralized API service
      const result = await getPipelineInfo(false, {
        limit,
        offset,
        all_data: allData
      });

      // Check if the limit was clamped by comparing with the result length
      // If we requested more than we got and we're not at the end of data, it was likely clamped
      const wasClamped = originalLimit > result.length && result.length > 0;
      limitClamped.value = wasClamped;
      clampedLimit.value = wasClamped ? result.length : null;

      data.value = result;
      total.value = result.length; // Note: this is the actual count returned, not total available
      pipelines.value = result;

      return {
        data: result,
        total: result.length,
        limitClamped: wasClamped,
        clampedLimit: wasClamped ? result.length : null
      };
    } catch (error) {
      console.error('Error fetching pipeline data:', error);
      throw error;
    } finally {
      loading.value = false;
    }
  }

  return {
    data,
    total,
    pipelines,
    loading,
    limitClamped,
    clampedLimit,
    fetchPipelines
  };
}
