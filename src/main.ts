import { createApp } from 'vue';
import App from './App.vue';
import './assets/main.css';
import { createPinia } from 'pinia';
import { usePrefsStore } from '@/stores/prefs';
import { watch } from 'vue';
import { useToastsStore } from '@/stores/toasts';

const app = createApp(App);
const pinia = createPinia();
app.use(pinia);
app.mount('#app');

// Apply dark mode class based on prefs (store already handled system preference fallback)
const prefs = usePrefsStore();
const applyDark = (on: boolean) => document.documentElement.classList.toggle('dark', on);
applyDark(prefs.darkMode);
watch(() => prefs.darkMode, applyDark);

// Global error monitoring: surface errors via toasts and optionally escalate
const toasts = useToastsStore();

// Avoid duplicate handler registration during HMR
let handlersInstalled = (globalThis as any).__pd_handlers_installed__;
if (!handlersInstalled) {
	(globalThis as any).__pd_handlers_installed__ = true;

	window.addEventListener('error', (e) => {
		// Suppress noisy CSS load errors in dev but report JS errors
		const msg = e?.error?.message || e?.message || 'Unknown error';
		toasts.push(`Runtime error: ${msg}`, { type: 'error', timeoutMs: 6000 });
	});

	window.addEventListener('unhandledrejection', (e) => {
		const reason: any = (e && (e as any).reason) || {};
		const msg = reason?.message || String(reason) || 'Unhandled promise rejection';
		toasts.push(`Unhandled: ${msg}`, { type: 'error', timeoutMs: 6000 });
	});
}