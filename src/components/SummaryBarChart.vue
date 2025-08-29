<template>
  <div class="w-full max-w-2xl">
    <h4 class="text-md font-semibold mb-2">Avg Duration by Pipeline</h4>
    <Bar :data="chartData" :options="chartOptions" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { Bar } from 'vue-chartjs';
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale
} from 'chart.js';
import type { PipelineSummary } from '@/composables/usePipelineSummaryData';

ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale);

const props = defineProps<{ summaries: PipelineSummary[] }>();

const chartData = computed(() => ({
  labels: props.summaries.map(s => s.pipeline_name),
  datasets: [
    {
      label: 'Avg Duration (s)',
      backgroundColor: '#6366f1',
      data: props.summaries.map(s => s.avg_duration)
    }
  ]
}));

const chartOptions = {
  responsive: true,
  plugins: {
    legend: { display: false },
    tooltip: { callbacks: { label: (ctx: any) => `${Math.round(ctx.parsed.y)}s` } }
  },
  scales: {
    y: { beginAtZero: true, title: { display: true, text: 'Seconds' } },
    x: { title: { display: true, text: 'Pipeline' } }
  }
};
</script>
