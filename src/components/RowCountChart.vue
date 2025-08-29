<template>
  <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg h-[440px] flex flex-col">
    <h3 class="text-lg font-semibold mb-4">Rows Processed (Last 10)</h3>
    <div style="overflow-x: auto; min-width: 0;">
      <div style="min-width: 700px;">
        <Line ref="chartRef" :data="chartData" :options="chartOptions" class="flex-1" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
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
import type { Chart } from 'chart.js';

ChartJS.register(
  Title, Tooltip, Legend, LineElement, PointElement, CategoryScale, LinearScale
);

const emit = defineEmits<{ (e: 'item-click', run: PipelineRun): void; (e: 'selection-change', keys: string[]): void }>();
const props = defineProps<{ pipelines: PipelineRun[]; selectedKey?: string; selectedKeys?: string[] }>();

const keyOf = (p: PipelineRun) => String(p.pid ?? `${p.start_utc}|${p.pipeline_name}`);
const chartRuns = computed(() => {
  // Show all runs in the current page (paged from table)
  return [...props.pipelines].reverse(); // newest last for chart
});

const chartData = computed(() => ({
  labels: chartRuns.value.map(p => format(new Date(p.start_utc), 'MM/dd HH:mm')),
  datasets: [
    {
      label: 'Rows Processed',
      backgroundColor: '#10b981',
      borderColor: '#10b981',
      data: chartRuns.value.map(p => p.rowcount),
      fill: false,
      tension: 0.1,
      pointRadius: chartRuns.value.map(p => isSelected(p) ? 5 : 3),
      pointBackgroundColor: chartRuns.value.map(p => isSelected(p) ? '#059669' : '#10b981')
    }
  ]
}));

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  scales: { y: { beginAtZero: true } },
  onClick: (evt: any, elements: any[]) => {
    const ci = (chartRef.value as any)?.['chart'] as Chart | undefined;
    if (!ci || !elements?.length) return;
    const first = elements[0];
    const idx = first.index as number;
  const run = chartRuns.value[idx];
    if (!run) return;
    if (evt?.native?.ctrlKey || evt?.native?.metaKey) {
      const key = keyOf(run);
      const current = props.selectedKeys && props.selectedKeys.length ? [...props.selectedKeys] : (props.selectedKey ? [props.selectedKey] : []);
      const next = current.includes(key) ? current.filter(k => k !== key) : [...current, key];
      emit('selection-change', next);
    } else {
      emit('item-click', run);
    }
  }
};

const chartRef = ref<InstanceType<typeof Line> | null>(null);

function isSelected(p: PipelineRun) {
  const key = keyOf(p);
  if (props.selectedKeys && props.selectedKeys.length) {
    return props.selectedKeys.includes(key);
  }
  return props.selectedKey ? key === props.selectedKey : false;
}

watch(() => props.selectedKey, () => {
  const ci = (chartRef.value as any)?.['chart'] as Chart | undefined;
  ci?.update();
});
</script>