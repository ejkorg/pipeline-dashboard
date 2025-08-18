import { ref } from 'vue';

export interface Toast {
    id: number;
    message: string;
    type?: 'info' | 'success' | 'error' | 'warn';
    timeout?: number;
}

const toasts = ref<Toast[]>([]);
let counter = 0;

export function useToasts() {
    function push(message: string, opts: Partial<Omit<Toast, 'id' | 'message'>> = {}) {
        const t: Toast = {
            id: ++counter,
            message,
            type: opts.type || 'info',
            timeout: opts.timeout ?? 4000
        };
        toasts.value.push(t);
        if (t.timeout) {
            setTimeout(() => dismiss(t.id), t.timeout);
        }
    }
    function dismiss(id: number) {
        toasts.value = toasts.value.filter(t => t.id !== id);
    }
    return { toasts, push, dismiss };
}