import { defineStore } from 'pinia';
import { ref } from 'vue';

export interface Toast {
  id: string;
  message: string;
  type?: 'info' | 'success' | 'error' | 'warn';
  timeoutMs?: number;
  createdAt: number;
}

export const useToastsStore = defineStore('toasts', () => {
  const toasts = ref<Toast[]>([]);

  function push(message: string, opts: Partial<Omit<Toast, 'id' | 'message' | 'createdAt'>> = {}) {
    const id = crypto.randomUUID();
    const toast: Toast = {
      id,
      message,
      type: opts.type || 'info',
      timeoutMs: opts.timeoutMs ?? 4000,
      createdAt: Date.now()
    };
    toasts.value.push(toast);
    if (toast.timeoutMs) {
      setTimeout(() => dismiss(id), toast.timeoutMs);
    }
    return id;
  }

  function dismiss(id: string) {
    toasts.value = toasts.value.filter(t => t.id !== id);
  }

  function clear() {
    toasts.value = [];
  }

  return { toasts, push, dismiss, clear };
});
