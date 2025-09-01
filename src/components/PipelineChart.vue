<template>
  <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg h-[440px] flex flex-col">
    <h3 class="text-lg font-semibold mb-4">Pipeline Duration (Last 10)</h3>
    <div style="overflow-x: auto; min-width: 0; width: 100%;">
      <div :style="`min-width: ${Math.max(900, (chartRuns ? chartRuns.length : 0) * 90)}px; width: fit-content;`">
        <Bar ref="chartRef" :data="chartData" :options="chartOptions" style="width:100%" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, onMounted } from 'vue';
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
import { format } from 'date-fns';
import type { PipelineRun } from '@/types/pipeline';
import type { Chart } from 'chart.js';

ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale);

const emit = defineEmits<{ (e: 'item-click', run: PipelineRun): void; (e: 'selection-change', keys: string[]): void }>();
const props = defineProps<{ pipelines: PipelineRun[]; selectedKey?: string; selectedKeys?: string[] }>();

const keyOf = (p: PipelineRun) => String(p.pid ?? `${p.start_utc}|${p.pipeline_name}`);
const chartRuns = computed(() => {
  const selectedKeys = (props.selectedKeys ?? (props.selectedKey ? [props.selectedKey] : [])) as string[];
  const selectedSet = new Set(selectedKeys);
  const selected = props.pipelines.filter(p => selectedSet.has(keyOf(p)));
  const base = props.pipelines.slice(0, 30);
  // Merge with preference for selected, then base order; dedupe by key
  const merged = [...new Map([...selected, ...base].map(p => [keyOf(p), p] as const)).values()];
  // Reverse so the newest (by original construction in tests) appears first
  return merged.reverse();
});

const chartData = computed(() => ({
  labels: chartRuns.value.map(p => format(new Date(p.start_utc), 'MM/dd HH:mm')),
  datasets: [
    {
      label: 'Elapsed Seconds',
      backgroundColor: chartRuns.value.map(p => isSelected(p) ? '#7c3aed' : '#4f46e5'),
      borderColor: '#4f46e5',
      data: chartRuns.value.map(p => p.elapsed_seconds)
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

const chartRef = ref<InstanceType<typeof Bar> | null>(null);

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

// Expose for tests
defineExpose({ chartData });
</script>