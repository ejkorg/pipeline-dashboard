<template>
  <div class="w-full max-w-2xl">
    <h4 class="text-md font-semibold mb-2">Avg Rowcount vs Duration</h4>
    <Scatter :data="chartData" :options="chartOptions" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { Scatter } from 'vue-chartjs';
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  PointElement,
  LineElement,
  CategoryScale,
  LinearScale
} from 'chart.js';
import type { PipelineSummary } from '@/composables/usePipelineSummaryData';

ChartJS.register(Title, Tooltip, Legend, PointElement, LineElement, CategoryScale, LinearScale);

const props = defineProps<{ summaries: PipelineSummary[] }>();

const chartData = computed(() => ({
  datasets: [
    {
      label: 'Pipelines',
      backgroundColor: '#10b981',
      data: props.summaries.map(s => ({ x: s.avg_duration, y: s.avg_rowcount, pipeline: s.pipeline_name })),
      pointRadius: 6
    }
  ]
}));

const chartOptions = {
  responsive: true,
  plugins: {
    tooltip: {
      callbacks: {
        label: (ctx: any) => {
          const d = ctx.raw;
          return `${d.pipeline}: ${Math.round(d.x)}s, ${Math.round(d.y)} rows`;
        }
      }
    }
  },
  scales: {
    x: { beginAtZero: true, title: { display: true, text: 'Avg Duration (s)' } },
    y: { beginAtZero: true, title: { display: true, text: 'Avg Rowcount' } }
  }
};
</script>
