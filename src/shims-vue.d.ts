// For IDEs that still rely on legacy shims (Vue 3 usually okay without, but added for completeness)
declare module '*.vue' {
    import type { DefineComponent } from 'vue';
    const component: DefineComponent<Record<string, unknown>, Record<string, unknown>, any>;
    export default component;
  }