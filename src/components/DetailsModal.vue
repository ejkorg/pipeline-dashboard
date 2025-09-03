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
          <div class="flex items-center gap-2 mt-1">
            <button
              v-if="run.output_file"
              class="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
              @click="viewFile(run.output_file!, 'output')"
            >View</button>
            <button
              v-if="run.output_file"
              class="px-2 py-1 text-xs bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
              @click="copyUrl(run.output_file!)"
              title="Copy full file URL"
            >Copy URL</button>
          </div>
        </div>
        <div class="col-span-2">
          <div class="text-gray-500">Log File</div>
          <div class="font-mono break-all">{{ run.log_file || '-' }}</div>
          <div class="flex items-center gap-2 mt-1">
            <button
              v-if="run.log_file"
              class="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
              @click="viewFile(run.log_file!, 'log')"
            >View</button>
            <button
              v-if="run.log_file"
              class="px-2 py-1 text-xs bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
              @click="copyUrl(run.log_file!)"
              title="Copy full file URL"
            >Copy URL</button>
          </div>
        </div>
        <div class="col-span-2">
          <div class="text-gray-500">Archived File</div>
          <div class="font-mono break-all text-xs" :title="run.archived_file || '-'">{{ run.archived_file || '-' }}</div>
          <div class="flex items-center gap-2 mt-1 flex-wrap">
            <button
              v-if="run.archived_file"
              class="px-2 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
              :disabled="checking"
              @click="viewFile(run.archived_file!, 'archive')"
            >
              {{ checking ? 'Checking…' : 'View' }}
            </button>
            <button
              v-if="run.archived_file"
              class="px-2 py-1 text-xs bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50"
              :disabled="checking"
              @click="fetchArchiveMeta(run.archived_file!)"
              title="Fetch metadata (size, type, last-modified)"
            >Info</button>
            <button
              v-if="run.archived_file"
              class="px-2 py-1 text-xs bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
              @click="copyUrl(run.archived_file!)"
              title="Copy full file URL"
            >Copy URL</button>
            <span v-if="run.archived_file" class="text-[10px] text-gray-500">Preview supported for small .gz files (≤ {{ prefs.archivePreviewMaxMB }}MB). Larger files will download.</span>
          </div>
          <div v-if="archiveMeta" class="mt-1 text-[11px] text-gray-600 dark:text-gray-300">
            <span v-if="archiveMeta.exists">
              <span v-if="archiveMeta.size != null">Size: {{ formatBytes(archiveMeta.size) }}</span>
              <span v-if="archiveMeta.contentType"> • Type: {{ archiveMeta.contentType }}</span>
              <span v-if="archiveMeta.lastModified"> • Last Modified: {{ archiveMeta.lastModified }}</span>
            </span>
            <span v-else>File not found</span>
          </div>
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
import { streamFile, getFileMetadata } from '@/services/fileService';
import { useToastsStore } from '@/stores/toasts';
import { usePrefsStore } from '@/stores/prefs';

defineProps<{ run: PipelineRun | null; otherRuns?: PipelineRun[] }>();
const tab = ref<'overview' | 'json'>('overview');
function pretty(o: any) { return JSON.stringify(o, null, 2); }
const toasts = useToastsStore();
const prefs = usePrefsStore();
const checking = ref(false);
const archiveMeta = ref<{ size?: number; lastModified?: string; contentType?: string; exists: boolean } | null>(null);
const baseUrl = import.meta.env.VITE_API_BASE_URL || '/pipeline-service';

function formatBytes(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let i = 0;
  let n = bytes;
  while (n >= 1024 && i < units.length - 1) { n /= 1024; i++; }
  return `${n.toFixed(n < 10 && i > 0 ? 1 : 0)} ${units[i]}`;
}

function makeAbsolute(path: string) {
  return path.startsWith('/') ? path : `/${path}`;
}

async function copyUrl(filePath: string) {
  const absolutePath = makeAbsolute(filePath);
  const fullUrl = `${baseUrl}${absolutePath}`;
  try {
    await navigator.clipboard.writeText(fullUrl);
    toasts.push('File URL copied to clipboard', { type: 'success', timeoutMs: 2000 });
  } catch {
    // Fallback for clipboard API restrictions
    const ta = document.createElement('textarea');
    ta.value = fullUrl; document.body.appendChild(ta); ta.select();
    document.execCommand('copy'); document.body.removeChild(ta);
    toasts.push('File URL copied to clipboard', { type: 'success', timeoutMs: 2000 });
  }
}

async function fetchArchiveMeta(filePath: string) {
  const absolutePath = makeAbsolute(filePath);
  try {
    checking.value = true;
    const meta = await getFileMetadata(absolutePath);
    archiveMeta.value = meta;
  } catch (e) {
    toasts.push('Failed to fetch metadata', { type: 'error' });
  } finally {
    checking.value = false;
  }
}

async function viewFile(filePath: string, type: 'output' | 'log' | 'archive') {
  try {
    // Ensure filePath is treated as absolute by prepending base URL if not already
    const absolutePath = makeAbsolute(filePath);
    if (type === 'archive') {
      checking.value = true;
      const meta = await getFileMetadata(absolutePath);
      checking.value = false;
      archiveMeta.value = meta;
      if (!meta.exists) {
        toasts.push('Archived file not found on server', { type: 'error' });
        return;
      }
      const limitBytes = prefs.archivePreviewMaxMB * 1024 * 1024;
      if (meta.size && meta.size > limitBytes) {
        toasts.push('Archive is large; downloading instead of previewing', { type: 'info' });
      } else {
        toasts.push('Opening archive preview…', { type: 'info' });
      }
    }
  const maxPreviewBytes = prefs.archivePreviewMaxMB * 1024 * 1024;
  await streamFile(absolutePath, type, { maxPreviewBytes });
  } catch (error) {
    console.error('Failed to view file:', error);
    toasts.push('Failed to open file. See console for details.', { type: 'error' });
  }
}
</script>
