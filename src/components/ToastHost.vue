<template>
    <div class="fixed top-4 right-4 z-50 flex flex-col gap-2">
      <div
        v-for="t in toasts"
        :key="t.id"
        :class="[
          'px-4 py-2 rounded shadow text-sm text-white flex items-center gap-3 min-w-[220px]',
          t.type === 'success' && 'bg-green-600',
          t.type === 'error' && 'bg-red-600',
          t.type === 'warn' && 'bg-amber-600',
          t.type === 'info' && 'bg-gray-700'
        ]"
        role="status"
      >
        <span>{{ t.message }}</span>
        <button
          class="ml-auto text-white/80 hover:text-white"
          @click="dismiss(t.id)"
          aria-label="Dismiss notification"
        >✕</button>
      </div>
    </div>
  </template>
  
  <script setup lang="ts">
  import { storeToRefs } from 'pinia';
  import { useToastsStore } from '@/stores/toasts';
  const store = useToastsStore();
  const { toasts } = storeToRefs(store as any);
  const dismiss = store.dismiss;
  </script>