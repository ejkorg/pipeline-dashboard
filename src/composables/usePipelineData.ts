import { ref } from 'vue';
import axios from 'axios';
import { buildEndpoint } from '@/services/pipelineApi';

export function usePipelineData() {
  const data = ref([]);
  const total = ref(0);
  const pipelines = ref([]);
  const loading = ref(false);

  async function fetchPipelines(limit = 100, offset = 0) {
    loading.value = true;
    const baseUrl = import.meta.env.VITE_API_BASE_URL || '/pipeline-service';
    const endpoint = buildEndpoint({ limit, offset, all_data: true });
    const url = `${baseUrl}${endpoint}`;
    
    const res = await axios.get(url);
    data.value = res.data.results;
    total.value = res.data.total;
    pipelines.value = res.data.pipelines;
    loading.value = false;
  }

  return { data, total, pipelines, loading, fetchPipelines };
}
