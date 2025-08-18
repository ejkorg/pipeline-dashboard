import type { PipelineRun } from '@/types/pipeline';
import { logger } from '@/utils/logger';

type Listener = (update: PipelineRun[]) => void;

let socket: any;
let eventSource: EventSource | null = null;
const listeners: Listener[] = [];

export function onRealtime(listener: Listener) {
    listeners.push(listener);
    return () => {
        const i = listeners.indexOf(listener);
        if (i >= 0) listeners.splice(i, 1);
    };
}

function emit(data: PipelineRun[]) {
    listeners.forEach(l => l(data));
}

export function connectRealtime(mode: string, wsUrl: string, token?: string) {
    if (mode === 'ws') {
        import('socket.io-client')
            .then(({ io }) => {
                socket = io(wsUrl, { transports: ['websocket'], auth: token ? { token } : undefined });
                socket.on('connect', () => logger.info('WebSocket connected'));
                socket.on('pipelines', (payload: PipelineRun[]) => emit(payload));
                socket.on('disconnect', () => logger.warn('WebSocket disconnected'));
            })
            .catch(e => logger.error('WS import failed', e));
    } else if (mode === 'sse') {
        eventSource = new EventSource(`${wsUrl.replace(/^ws/, 'http')}/events`);
        eventSource.onmessage = ev => {
            try {
                const data = JSON.parse(ev.data);
                if (Array.isArray(data)) emit(data);
            } catch (e) {
                logger.error('SSE parse error', e);
            }
        };
        eventSource.onerror = e => logger.error('SSE error', e);
    }
}

export function disconnectRealtime() {
    if (socket) {
        socket.close?.();
        socket = null;
    }
    if (eventSource) {
        eventSource.close();
        eventSource = null;
    }
}