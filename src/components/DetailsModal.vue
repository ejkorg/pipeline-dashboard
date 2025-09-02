<template>
  <div class="fixed inset-0 bg-black/40 z-50 flex items-center justify-center" @click.self="$emit('close')">
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-3xl p-6">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-semibold">Run Details</h3>
        <button class="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300" @click="$emit('close')">✕</button>
      </div>
      <div class="mb-3 border-b border-gray-200 dark:border-gray-700">
        <nav class="flex gap-4 text-sm">
          <button :class="tab==='overview' ? 'border-b-2 border-indigo-600 font-semibold' : 'text-gray-500'" class="px-1 py-2" @click="tab='overview'">Overview</button>
          <button :class="tab==='json' ? 'border-b-2 border-indigo-600 font-semibold' : 'text-gray-500'" class="px-1 py-2" @click="tab='json'">Raw JSON</button>
        </nav>
      </div>
      <div v-if="run && tab==='overview'" class="grid grid-cols-2 gap-4 text-sm">
        <div>
          <div class="text-gray-500">Pipeline</div>
          <div class="font-medium">{{ run.pipeline_name }}</div>
        </div>
        <div>
          <div class="text-gray-500">Environment</div>
          <div class="font-medium">{{ run.environment || 'N/A' }}</div>
        </div>
        <div>
          <div class="text-gray-500">Script</div>
          <div class="font-medium">{{ run.script_name || 'N/A' }}</div>
        </div>
        <div>
          <div class="text-gray-500">Type</div>
          <div class="font-medium">{{ run.pipeline_type || 'N/A' }}</div>
        </div>
        <div>
          <div class="text-gray-500">Start (UTC)</div>
          <div class="font-mono">{{ run.start_utc }}</div>
        </div>
        <div>
          <div class="text-gray-500">End (UTC)</div>
          <div class="font-mono">{{ run.end_utc || '-' }}</div>
        </div>
        <div>
          <div class="text-gray-500">Start (Local)</div>
          <div class="font-mono">{{ run.start_local || '-' }}</div>
        </div>
        <div>
          <div class="text-gray-500">End (Local)</div>
          <div class="font-mono">{{ run.end_local || '-' }}</div>
        </div>
        <div>
          <div class="text-gray-500">Duration</div>
          <div class="font-medium">{{ run.elapsed_human || run.elapsed_seconds + 's' }}</div>
        </div>
        <div>
          <div class="text-gray-500">Rows</div>
          <div class="font-medium">{{ run.rowcount?.toLocaleString?.() ?? run.rowcount }}</div>
        </div>
        <div>
          <div class="text-gray-500">PID</div>
          <div class="font-mono">{{ run.pid ?? '-' }}</div>
        </div>
        <div>
          <div class="text-gray-500">Exit Code</div>
          <div class="font-mono">{{ run.exit_code ?? '-' }}</div>
        </div>
        <div>
          <div class="text-gray-500">Status</div>
          <div class="font-medium">{{ run.status || '-' }}</div>
        </div>
        <div>
          <div class="text-gray-500">Date Code</div>
          <div class="font-mono">{{ run.date_code || '-' }}</div>
        </div>
        <div class="col-span-2">
          <div class="text-gray-500">Output File</div>
          <div class="font-mono break-all">{{ run.output_file || '-' }}</div>
        </div>
        <div class="col-span-2">
          <div class="text-gray-500">Log File</div>
          <div class="font-mono break-all">{{ run.log_file || '-' }}</div>
        </div>
      </div>
      <div v-else-if="run && tab==='json'" class="text-xs">
        <pre class="bg-gray-100 dark:bg-gray-900 p-3 rounded overflow-auto max-h-[50vh]">{{ pretty(run) }}</pre>
      </div>
      <div v-else class="text-sm text-gray-500">No details.</div>
      <div class="mt-6 text-right">
        <button class="px-4 py-2 rounded bg-indigo-600 text-white text-sm" @click="$emit('close')">Close</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { PipelineRun } from '@/types/pipeline';
import { ref } from 'vue';

defineProps<{ run: PipelineRun | null; otherRuns?: PipelineRun[] }>();
const tab = ref<'overview' | 'json'>('overview');
function pretty(o: any) { return JSON.stringify(o, null, 2); }
</script>
