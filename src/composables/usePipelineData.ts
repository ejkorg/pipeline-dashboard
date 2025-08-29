import { ref } from 'vue';
import axios from 'axios';

export function usePipelineData() {
  const data = ref([]);
  const total = ref(0);
  const pipelines = ref([]);
  const loading = ref(false);

  async function fetchPipelines(limit = 100, offset = 0) {
    loading.value = true;
    const res = await axios.get('http://10.253.112.87:8001/get_pipeline_info', {
      params: { limit, offset, all_data: true }
    });
    data.value = res.data.results;
    total.value = res.data.total;
    pipelines.value = res.data.pipelines;
    loading.value = false;
  }

  return { data, total, pipelines, loading, fetchPipelines };
}
