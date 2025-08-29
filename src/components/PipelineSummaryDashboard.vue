<template>
  <div class="prose dark:prose-invert max-w-none">
    <div class="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-8 mb-8">
      <h2 class="text-2xl font-bold mb-2 tracking-tight text-gray-900 dark:text-white">Pipeline Summary</h2>
      <p class="text-gray-500 dark:text-gray-400 mb-6 text-sm">Overview of all pipelines, their latest runs, and performance metrics.</p>
      <div v-if="loading" class="text-base text-gray-400 py-8 text-center">Loading pipeline summary...</div>
      <div v-else-if="error" class="text-base text-red-500 py-8 text-center">{{ error }}</div>
      <div v-else class="flex flex-col gap-8">
        <!-- Charts at the top -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          <div class="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
            <h3 class="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Avg Duration by Pipeline</h3>
            <SummaryBarChart :summaries="summaries" />
          </div>
          <div class="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
            <h3 class="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Avg Rowcount vs Duration</h3>
            <SummaryScatterChart :summaries="summaries" />
          </div>
        </div>
        <!-- Summary table next -->
        <div class="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 mt-10">
          <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-sm">
            <thead class="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th class="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-200 whitespace-nowrap">Name</th>
                <th class="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-200 whitespace-nowrap">Script</th>
                <th class="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-200 whitespace-nowrap">Type</th>
                <th class="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-200 whitespace-nowrap">Env</th>
                <th class="px-4 py-3 text-right font-semibold text-gray-700 dark:text-gray-200 whitespace-nowrap">Total Runs</th>
                <th class="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-200 whitespace-nowrap">Last Run</th>
                <th class="px-4 py-3 text-right font-semibold text-gray-700 dark:text-gray-200 whitespace-nowrap">Avg Duration</th>
                <th class="px-4 py-3 text-right font-semibold text-gray-700 dark:text-gray-200 whitespace-nowrap">Avg Rowcount</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100 dark:divide-gray-700">
              <tr v-for="p in summaries" :key="p.pipeline_name" class="hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                <td class="px-4 py-2 font-medium text-gray-900 dark:text-white whitespace-nowrap">{{ p.pipeline_name }}</td>
                <td class="px-4 py-2 text-gray-700 dark:text-gray-300 whitespace-nowrap">{{ p.script_name }}</td>
                <td class="px-4 py-2 text-gray-700 dark:text-gray-300 whitespace-nowrap">{{ p.pipeline_type }}</td>
                <td class="px-4 py-2 text-gray-700 dark:text-gray-300 whitespace-nowrap">{{ p.environment }}</td>
                <td class="px-4 py-2 text-right text-gray-700 dark:text-gray-300 whitespace-nowrap">{{ p.total_runs }}</td>
                <td class="px-4 py-2 text-gray-700 dark:text-gray-300 whitespace-nowrap">{{ formatDate(p.last_run) }}</td>
                <td class="px-4 py-2 text-right text-gray-700 dark:text-gray-300 whitespace-nowrap">{{ formatDuration(p.avg_duration) }}</td>
                <td class="px-4 py-2 text-right text-gray-700 dark:text-gray-300 whitespace-nowrap">{{ Math.round(p.avg_rowcount).toLocaleString() }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <!-- Detailed table last -->
        <div class="mt-10">
          <h3 class="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Pipeline Run Details</h3>
          <PipelineTable
            :pipelines="pipelines"
            @item-click="onItemClick"
            @selection-change="onSelectionChange"
          />
          <DetailsModal v-if="showModal && selectedRun" :run="selectedRun" @close="closeModal" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { usePipelineSummaryData } from '@/composables/usePipelineSummaryData';
import { usePipelinesStore } from '@/stores/pipelines';
import SummaryBarChart from './SummaryBarChart.vue';
import SummaryScatterChart from './SummaryScatterChart.vue';
import PipelineTable from './PipelineTable.vue';
import DetailsModal from './DetailsModal.vue';

const { summaries, loading, error, fetchSummaries } = usePipelineSummaryData();
const pipelinesStore = usePipelinesStore();
const pipelines = pipelinesStore.pipelines;

const selectedRun = ref(null);
const showModal = ref(false);

function onItemClick(run: any) {
  selectedRun.value = run;
  showModal.value = true;
}
function onSelectionChange(keys: string[]) {
  if (keys.length) {
    const first = pipelines.find((r: any) => String(r.pid ?? `${r.start_utc}|${r.pipeline_name}`) === keys[0]);
    if (first) selectedRun.value = first;
  }
}
function closeModal() {
  showModal.value = false;
}

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
