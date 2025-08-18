import type { PipelineRun } from '@/types/pipeline';

interface CacheEntry {
    data: PipelineRun[];
    ts: number;
}

let entry: CacheEntry | null = null;
const TTL = 30 * 1000;

export function getCache(): PipelineRun[] | null {
    if (!entry) return null;
    if (Date.now() - entry.ts > TTL) return null;
    return entry.data;
}

export function setCache(data: PipelineRun[]) {
    entry = { data, ts: Date.now() };
}