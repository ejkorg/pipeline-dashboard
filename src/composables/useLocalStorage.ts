import { ref, watch } from 'vue';

export function useLocalStorage<T>(key: string, initial: T) {
    const stored = localStorage.getItem(key);
    const state = ref<T>(stored ? (tryParse(stored) ?? initial) : initial);
    watch(
        state,
        v => {
            try {
                localStorage.setItem(key, JSON.stringify(v));
            } catch {
                /* ignore */
            }
        },
        { deep: true }
    );
    return state;
}

function tryParse(s: string) {
    try {
        return JSON.parse(s);
    } catch {
        return null;
    }
}