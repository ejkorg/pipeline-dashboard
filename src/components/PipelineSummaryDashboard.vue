<template>
  <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
    <h3 class="text-lg font-semibold mb-4">Pipeline Summary</h3>
    <div v-if="loading" class="text-xs text-gray-400">Loading...</div>
    <div v-else-if="error" class="text-xs text-red-500">{{ error }}</div>
    <div v-else>
      <table class="w-full text-sm mb-4">
        <thead>
          <tr>
            <th class="py-2 px-3 text-left">Name</th>
            <th class="py-2 px-3 text-left">Script</th>
            <th class="py-2 px-3 text-left">Type</th>
            <th class="py-2 px-3 text-left">Env</th>
            <th class="py-2 px-3 text-left">Total Runs</th>
            <th class="py-2 px-3 text-left">Last Run</th>
            <th class="py-2 px-3 text-left">Avg Duration</th>
            <th class="py-2 px-3 text-left">Avg Rowcount</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="p in summaries" :key="p.pipeline_name">
            <td class="py-2 px-3">{{ p.pipeline_name }}</td>
            <td class="py-2 px-3">{{ p.script_name }}</td>
            <td class="py-2 px-3">{{ p.pipeline_type }}</td>
            <td class="py-2 px-3">{{ p.environment }}</td>
            <td class="py-2 px-3">{{ p.total_runs }}</td>
            <td class="py-2 px-3">{{ formatDate(p.last_run) }}</td>
            <td class="py-2 px-3">{{ formatDuration(p.avg_duration) }}</td>
            <td class="py-2 px-3">{{ Math.round(p.avg_rowcount).toLocaleString() }}</td>
          </tr>
        </tbody>
      </table>
      <div class="flex flex-wrap gap-6">
        <SummaryBarChart :summaries="summaries" />
        <SummaryScatterChart :summaries="summaries" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { usePipelineSummaryData } from '@/composables/usePipelineSummaryData';
import SummaryBarChart from './SummaryBarChart.vue';
import SummaryScatterChart from './SummaryScatterChart.vue';

const { summaries, loading, error, fetchSummaries } = usePipelineSummaryData();

onMounted(() => {
  fetchSummaries();
});

function formatDate(iso: string) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleString();
}
function formatDuration(sec: number) {
  if (!sec) return '';
  const m = Math.floor(sec / 60);
  const s = Math.round(sec % 60);
  return `${m}m ${s}s`;
}
</script>
