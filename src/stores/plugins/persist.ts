import type { PiniaPluginContext } from 'pinia';

interface PersistOptions<T = any> {
  key: string;
  paths?: (keyof T)[];
}

declare module 'pinia' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  export interface DefineStoreOptionsBase<S, Store> {
    persist?: PersistOptions<S>;
  }
}

export function persistPlugin({ options, store }: PiniaPluginContext) {
  const persist = (options as any).persist as PersistOptions | undefined;
  if (!persist) return;
  const key = persist.key;
  const raw = localStorage.getItem(key);
  if (raw) {
    try {
      store.$patch(JSON.parse(raw));
    } catch {
      /* ignore */
    }
  }
  store.$subscribe((_mutation, state) => {
    const subset = persist.paths?.length
      ? Object.fromEntries(
          persist.paths.map(p => [p as string, (state as any)[p]])
        )
      : state;
    try {
      localStorage.setItem(key, JSON.stringify(subset));
    } catch {
      /* ignore */
    }
  });
}
