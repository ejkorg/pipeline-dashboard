<template>
    <div v-if="error">
      <slot name="fallback" :error="error">
        <div class="p-4 bg-red-50 border border-red-300 rounded text-red-800 text-sm">
          <p class="font-semibold">An error occurred:</p>
          <pre class="mt-2 whitespace-pre-wrap">{{ error.message }}</pre>
          <button
            class="mt-3 px-3 py-1 rounded bg-red-600 text-white text-xs"
            @click="reset"
          >Try Again</button>
        </div>
      </slot>
    </div>
    <template v-else>
      <slot />
    </template>
  </template>
  
  <script lang="ts">
  import { defineComponent, ref } from 'vue';
  
  export default defineComponent({
    name: 'ErrorBoundary',
    setup(_, { slots }) {
      const error = ref<Error | null>(null);
      function reset() {
        error.value = null;
      }
      return {
        error,
        reset,
        slots
      };
    },
    errorCaptured(err) {
      this.error = err instanceof Error ? err : new Error(String(err));
      return false;
    }
  });
  </script>