<template>
  <div
    class="bg-white dark:bg-gray-800 p-5 rounded-lg shadow relative overflow-hidden"
    role="group"
    :aria-label="label"
  >
    <div class="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 font-medium">
      {{ label }}
    </div>
    <div class="text-2xl font-bold mt-2">
      <slot>{{ value }}</slot>
    </div>
    <div v-if="trend" class="absolute top-2 right-2 text-xs"
         :class="trend === 'up' && 'text-red-500'
               || trend === 'down' && 'text-green-500'
               || trend === 'flat' && 'text-gray-400'">
      <span v-if="trend === 'up'">▲</span>
      <span v-else-if="trend === 'down'">▼</span>
      <span v-else>▬</span>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  label: string;
  value?: string | number;
  trend?: 'up' | 'down' | 'flat';
}>();
</script>