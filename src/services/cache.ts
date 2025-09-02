import type { PipelineRun } from '@/types/pipeline';

interface CacheEntry {
    data: PipelineRun[];
    ts: number;
}

const cache = new Map<string, CacheEntry>();
const TTL = 30 * 1000;

export function getCache(key: string): PipelineRun[] | null {
    const entry = cache.get(key);
    if (!entry) return null;
    if (Date.now() - entry.ts > TTL) {
        cache.delete(key);
        return null;
    }
    return entry.data;
}

export function setCache(key: string, data: PipelineRun[]) {
    cache.set(key, { data, ts: Date.now() });
}