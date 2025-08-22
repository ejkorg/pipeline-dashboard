<template>
  <button
    class="px-3 py-2 rounded-md border dark:border-gray-600 text-sm bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
    @click="toggle"
    :aria-pressed="darkMode.toString()"
  >
    <span v-if="darkMode">🌙 Dark</span>
    <span v-else>☀️ Light</span>
  </button>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { usePrefsStore } from '@/stores/prefs';

const prefs = usePrefsStore();
const { darkMode } = storeToRefs(prefs);
// Backwards-compatible alias in case an old hot-updated template still references isDark
// (can be removed after a full reload once migration is stable)
const isDark = darkMode;
// Optional explicit component name for better devtools labeling
// eslint-disable-next-line vue/require-name-property
defineOptions({ name: 'DarkModeToggle' });
function toggle() { prefs.toggleDark(); }
</script>