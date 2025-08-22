<template>
  <ErrorBoundary>
    <div class="text-gray-800 dark:text-gray-200 min-h-screen bg-gray-100 dark:bg-gray-900 flex flex-col">
      <header class="bg-white dark:bg-gray-800 shadow-md p-4 flex items-center gap-4">
        <h1 class="text-2xl font-bold flex-1">Pipeline Dashboard(DEV)</h1>
        <span
          v-if="lastFetchSource"
          :class="[
            'px-2 py-1 rounded text-xs font-medium border',
            lastFetchSource === 'live' && 'bg-green-100 text-green-700 border-green-300 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700',
            lastFetchSource === 'offline' && 'bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-700',
            lastFetchSource === 'fallback' && 'bg-red-100 text-red-700 border-red-300 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700'
          ]"
        >
          Data: {{ lastFetchSource.charAt(0).toUpperCase() + lastFetchSource.slice(1) }}
        </span>
        <DarkModeToggle />
      </header>
      <main class="p-4 md:p-8 flex-1">
        <Dashboard />
      </main>
      <footer class="text-xs text-center py-4 text-gray-500 dark:text-gray-400">
        &copy; {{ new Date().getFullYear() }} Pipeline Dashboard
      </footer>
    </div>
  </ErrorBoundary>
  <ToastHost />
</template>

<script setup lang="ts">
import Dashboard from '@/components/Dashboard.vue';
import DarkModeToggle from '@/components/DarkModeToggle.vue';
import ErrorBoundary from '@/components/ErrorBoundary.vue';
import ToastHost from '@/components/ToastHost.vue';
import { storeToRefs } from 'pinia';
import { usePipelinesStore } from '@/stores/pipelines';

const pStore = usePipelinesStore();
const { lastFetchSource } = storeToRefs(pStore);
</script>