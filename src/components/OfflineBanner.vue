<template>
  <div
    v-if="active"
    class="flex items-center gap-3 px-4 py-2 rounded border text-xs"
    :class="[
      'bg-amber-100 border-amber-300 text-amber-900 dark:bg-amber-900/30 dark:border-amber-700 dark:text-amber-200'
    ]"
    role="status"
    aria-live="polite"
  >
    <span class="font-semibold">Offline Sample Data</span>
    <span>- displaying bundled dataset</span>
    <button
      class="ml-auto px-2 py-1 rounded bg-amber-200 dark:bg-amber-800 hover:bg-amber-300 dark:hover:bg-amber-700"
      @click="$emit('disable')"
    >Go Live</button>
  </div>
</template>

<script setup lang="ts">
defineProps<{ active: boolean }>();
defineEmits<{ (e: 'disable'): void }>();
</script>
