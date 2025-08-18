<template>
  <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg h-[360px] flex flex-col">
    <h3 class="text-lg font-semibold mb-4">Rows Processed (Last 30)</h3>
    <Line :data="chartData" :options="chartOptions" class="flex-1" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { Line } from 'vue-chartjs';
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale
} from 'chart.js';
import { format } from 'date-fns';
import type { PipelineRun } from '@/types/pipeline';

ChartJS.register(
  Title, Tooltip, Legend, LineElement, PointElement, CategoryScale, LinearScale
);

const props = defineProps<{ pipelines: PipelineRun[] }>();
const latest = computed(() => props.pipelines.slice(0, 30).reverse());

const chartData = computed(() => ({
  labels: latest.value.map(p => format(new Date(p.start_utc), 'MM/dd HH:mm')),
  datasets: [
    {
      label: 'Rows Processed',
      backgroundColor: '#10b981',
      borderColor: '#10b981',
      data: latest.value.map(p => p.rowcount),
      fill: false,
      tension: 0.1
    }
  ]
}));

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  scales: { y: { beginAtZero: true } }
};
</script>