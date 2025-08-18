<template>
  <ErrorBoundary>
    <div class="text-gray-800 dark:text-gray-200 min-h-screen bg-gray-100 dark:bg-gray-900 flex flex-col">
      <header class="bg-white dark:bg-gray-800 shadow-md p-4 flex items-center gap-4">
        <h1 class="text-2xl font-bold flex-1">Pipeline Dashboard(DEV)</h1>
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
</script>