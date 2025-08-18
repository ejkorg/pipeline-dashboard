<template>
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
    <SummaryCard label="Total Runs" :value="totalRuns.toLocaleString()" />
    <SummaryCard label="Avg Duration" :value="averageDuration" />
    <SummaryCard label="Total Rows" :value="totalRowCount" />
    <SummaryCard label="Longest (s)" :value="longestDuration" />
    <SummaryCard label="Frequent Pipeline" :value="mostFrequentPipeline" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { PipelineRun } from '@/types/pipeline';
import SummaryCard from './SummaryCard.vue';

const props = defineProps<{ pipelines: PipelineRun[] }>();

const totalRuns = computed(() => props.pipelines.length);
const averageDuration = computed(() => {
  if (!props.pipelines.length) return '0s';
  const totalSeconds = props.pipelines.reduce((acc, p) => acc + p.elapsed_seconds, 0);
  const avg = totalSeconds / props.pipelines.length;
  if (avg < 60) return `${Math.round(avg)}s`;
  const m = Math.floor(avg / 60);
  const s = Math.round(avg % 60);
  return `${m}m ${s}s`;
});
const totalRowCount = computed(() =>
  props.pipelines.reduce((acc, p) => acc + p.rowcount, 0).toLocaleString()
);
const longestDuration = computed(() => {
  const max = props.pipelines.reduce((m, p) => Math.max(m, p.elapsed_seconds), 0);
  return max.toLocaleString();
});
const mostFrequentPipeline = computed(() => {
  const counts: Record<string, number> = {};
  for (const p of props.pipelines) {
    counts[p.pipeline_name] = (counts[p.pipeline_name] || 0) + 1;
  }
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';
});
</script>