<template>
    <button
      class="px-3 py-2 rounded-md border dark:border-gray-600 text-sm bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
      @click="toggle"
      aria-pressed="isDark.toString()"
    >
      <span v-if="isDark">🌙 Dark</span>
      <span v-else>☀️ Light</span>
    </button>
  </template>
  
  <script setup lang="ts">
  import { ref, watchEffect } from 'vue';
  
  const isDark = ref<boolean>(
    localStorage.getItem('app:dark') === 'true' ||
      (!localStorage.getItem('app:dark') && window.matchMedia('(prefers-color-scheme: dark)').matches)
  );
  
  function apply() {
    const root = document.documentElement;
    if (isDark.value) root.classList.add('dark');
    else root.classList.remove('dark');
    localStorage.setItem('app:dark', String(isDark.value));
  }
  watchEffect(apply);
  
  function toggle() {
    isDark.value = !isDark.value;
  }
  </script>