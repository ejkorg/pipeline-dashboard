// DEPRECATED: useToasts() -> use useToastsStore() from '@/stores/toasts'
import { useToastsStore } from '@/stores/toasts';

export function useToasts() {
    if (import.meta.env.DEV) {
        // eslint-disable-next-line no-console
        console.warn('[deprecated] useToasts() -> use useToastsStore()');
    }
        const store = useToastsStore();
        return { toasts: store.toasts, push: store.push, dismiss: store.dismiss };
}