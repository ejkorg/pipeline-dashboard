import { createApp } from 'vue';
import App from './App.vue';
import './assets/main.css';
import { createPinia } from 'pinia';
import { usePrefsStore } from '@/stores/prefs';
import { watch } from 'vue';

const app = createApp(App);
const pinia = createPinia();
app.use(pinia);
app.mount('#app');

// Apply dark mode class based on prefs (store already handled system preference fallback)
const prefs = usePrefsStore();
const applyDark = (on: boolean) => document.documentElement.classList.toggle('dark', on);
applyDark(prefs.darkMode);
watch(() => prefs.darkMode, applyDark);