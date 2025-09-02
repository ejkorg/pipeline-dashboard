import type { PipelineApiEnvelope, PipelineRun, RawPipelineRun } from '@/types/pipeline';
import { pipelineData } from '@/data.js';
import { ApiEnvelopeSchema } from '@/types/pipelineSchema';
import { logger } from '@/utils/logger';
import { getCache, setCache } from './cache';
import { z } from 'zod';

const baseUrl = import.meta.env.VITE_API_BASE_URL || '/pipeline-service';
// Make the endpoint path configurable to adapt to backend changes without code edits
// Default to full dataset and all fields unless overridden via env
const DEFAULT_ENDPOINT = import.meta.env.VITE_API_ENDPOINT_PATH || '/get_pipeline_info?limit=10000&offset=0&all_data=true';
const DEFAULT_TIMEOUT = Number(import.meta.env.VITE_API_TIMEOUT_MS) || 10000;
const OFFLINE_MODE = import.meta.env.VITE_OFFLINE_MODE === 'true';
const STRICT_NO_FALLBACK = import.meta.env['VITE_STRICT_NO_FALLBACK'] === 'true';

// Allow consumers to observe the source of the last fetch.
type SourceListener = (source: 'live' | 'offline' | 'fallback') => void;
let listeners: SourceListener[] = [];
export function onPipelineSource(listener: SourceListener) {
  listeners.push(listener);
  return () => { listeners = listeners.filter(l => l !== listener); };
}
function emitSource(s: 'live' | 'offline' | 'fallback') { for (const l of listeners) l(s); }

function fetchWithTimeout(resource: string, options: RequestInit & { timeout?: number } = {}) {
  const { timeout = DEFAULT_TIMEOUT, ...rest } = options;
  return Promise.race([
    fetch(resource, rest),
    new Promise<Response>((_, reject) =>
      setTimeout(() => reject(new Error(`Request timeout after ${timeout}ms`)), timeout)
    )
  ]) as Promise<Response>;
}

async function fetchJson<T>(url: string): Promise<T> {
  const resp = await fetchWithTimeout(url);
  if (!resp.ok) throw new Error(`HTTP ${resp.status} ${resp.statusText}`);
  return (await resp.json()) as T;
}

export function buildEndpoint({ limit, offset, all_data }: { limit?: number; offset?: number; all_data?: boolean } = {}): string {
  // If a full path with query preset is provided via env, merge/override its query with incoming params
  const qIndex = DEFAULT_ENDPOINT.indexOf('?');
  const path = qIndex >= 0 ? DEFAULT_ENDPOINT.substring(0, qIndex) : DEFAULT_ENDPOINT;
  const sp = new URLSearchParams(qIndex >= 0 ? DEFAULT_ENDPOINT.substring(qIndex + 1) : '');
  if (limit != null) sp.set('limit', String(Math.max(0, Math.floor(limit))));
  if (offset != null) sp.set('offset', String(Math.max(0, Math.floor(offset))));
  if (all_data != null) sp.set('all_data', all_data ? 'true' : 'false');
  return `${path}?${sp.toString()}`;
}

export async function getPipelineInfo(force = false, opts: { limit?: number; offset?: number; all_data?: boolean } = {}): Promise<PipelineRun[]> {
  const endpoint = buildEndpoint(opts);
  const fullUrl = `${baseUrl}${endpoint}`;
  const cacheKey = fullUrl; // Use full URL as cache key to differentiate by query params

  if (!force) {
    const cached = getCache(cacheKey);
    if (cached) return cached;
  }

  // Use mock data from src/data.js if VITE_USE_MOCK_DATA is set (but never during tests)
  if (import.meta.env['VITE_USE_MOCK_DATA'] === 'true' && import.meta.env.MODE !== 'test') {
    logger.info('Mock mode enabled - serving mock pipeline data from src/data.js');
  const rawList = (pipelineData.results || []) as RawPipelineRun[];
  const sanitized = sanitize(rawList);
  setCache('mock', sanitized); // Use fixed key for mock
  emitSource('offline');
  return sanitized;
  }
  // Explicit offline mode short-circuits network access
  if (OFFLINE_MODE) {
    logger.info('Offline mode enabled - serving local sample data');
    const sanitized = sanitize((pipelineData.results || []) as RawPipelineRun[]);
    setCache('offline', sanitized); // Use fixed key for offline
    emitSource('offline');
    return sanitized;
  }

  let raw: PipelineApiEnvelope | RawPipelineRun[] | undefined;
  let rawList: RawPipelineRun[];
  try {
    raw = await fetchJson<PipelineApiEnvelope | RawPipelineRun[]>(fullUrl);
  } catch (e: any) {
    // Network / timeout / HTTP error fallback: use bundled sample data (dev/demo mode only)
    if (import.meta.env.MODE !== 'test' && !STRICT_NO_FALLBACK) {
      logger.warn('API fetch failed, falling back to local sample data', { message: e?.message });
      rawList = (pipelineData.results || []) as RawPipelineRun[];
      const sanitized = sanitize(rawList);
      setCache('fallback', sanitized); // Use fixed key for fallback
      emitSource('fallback');
      return sanitized;
    }
    throw e; // preserve behavior for tests
  }

  try {
    if (Array.isArray(raw)) {
      rawList = raw;
    } else {
      const parsed = ApiEnvelopeSchema.parse(raw);
      // Prefer 'results', but fall back to common alternatives like 'data' or 'items'
      const res: any = (parsed as any).results ?? (parsed as any).data ?? (parsed as any).items;
      if (!res) {
        rawList = [];
      } else if (Array.isArray(res)) {
        rawList = res as RawPipelineRun[];
      } else if (res && typeof res === 'object') {
        // Determine if this object is a single run or a map of runs.
        // Heuristic: if every value of the object is itself an object containing at least
        // one of the canonical run identifying fields, treat it as a map.
        const values = Object.values(res);
        const isMap = values.length > 0 && values.every(v => v && typeof v === 'object' && ('start_utc' in (v as any) || 'pipeline_name' in (v as any)));
        if (isMap && !('start_utc' in res || 'pipeline_name' in res)) {
          rawList = values as RawPipelineRun[];
        } else {
          rawList = [res as RawPipelineRun];
        }
      } else {
        rawList = [];
      }
    }
  } catch (e) {
    if (e instanceof z.ZodError) {
      const details = e.issues
        .map(issue => `[${issue.path.join('.') || '(root)'}] ${issue.message}`)
        .join('; ');
      logger.error('Validation error', { issueCount: e.issues.length, details });
      if (import.meta.env['VITE_DEBUG_SCHEMA'] === 'true') {
        try {
          logger.warn('Offending payload snippet', JSON.stringify(raw).slice(0, 2000));
        } catch {/* ignore */}
      }
  if (import.meta.env.MODE !== 'test' && !STRICT_NO_FALLBACK) {
        logger.warn('Schema validation failed; using local sample data fallback');
        rawList = (pipelineData.results || []) as RawPipelineRun[];
      } else {
        throw new Error(`API schema validation failed: ${details}`);
      }
    } else {
      throw e;
    }
  }

  const sanitized = sanitize(rawList);
  setCache(cacheKey, sanitized);
  emitSource('live');
  return sanitized;
}function sanitize(raw: RawPipelineRun[]): PipelineRun[] {
  const sorted = raw
    .filter(r => r && (r.start_utc || r.start_local))
    .map<PipelineRun>((r: any) => {
      // Field synonyms to tolerate backend naming changes
      const startUtc = r.start_utc || r.start || r.start_time_utc || r.startTimeUtc || r.started_at || r.startedAt;
      const endUtc = r.end_utc || r.end || r.end_time_utc || r.endTimeUtc || r.ended_at || r.endedAt;
      const elapsedRaw = r.elapsed_seconds ?? r.duration_seconds ?? r.duration ?? (r.duration_ms != null ? Number(r.duration_ms) / 1000 : undefined);
      const rowsRaw = r.rowcount ?? r.row_count ?? r.rows ?? r.records;
      const pidRaw = r.pid ?? r.process_id ?? r.processId;
      const pipelineName = r.pipeline_name ?? r.pipeline ?? r.name ?? r.script_name;
      const environment = r.environment ?? r.env;
      const status = r.status ?? r.state ?? r.run_status ?? r.result;
      const exitRaw = r.exit_code ?? r.exitCode ?? r.code;
      const logFile = r.log_file ?? r.log ?? r.log_path ?? r.logPath;
      const outputFile = r.output_file ?? r.output ?? r.output_path ?? r.outputPath;

      const elapsedNum = Number(elapsedRaw) || 0;
      const rowsNum = Number(rowsRaw) || 0;
      const pidNum = pidRaw !== undefined ? Number(pidRaw) : undefined;

      return {
        start_local: r.start_local ?? r.start_local_time ?? r.startLocal ?? undefined,
        end_local: r.end_local ?? r.end_local_time ?? r.endLocal ?? undefined,
        start_utc: startUtc || r.start_local || new Date().toISOString(),
        end_utc: endUtc || undefined,
        elapsed_seconds: elapsedNum,
        elapsed_human: r.elapsed_human || r.duration_human || humanizeSeconds(elapsedNum),
        output_file: outputFile || undefined,
        rowcount: rowsNum,
        log_file: logFile || undefined,
        pid: isNaN(pidNum as number) ? undefined : pidNum,
        date_code: r.date_code ?? r.dateCode ?? undefined,
        pipeline_name: pipelineName || 'unknown',
        script_name: r.script_name || undefined,
        pipeline_type: r.pipeline_type || r.type || undefined,
        environment: environment ?? undefined,
        status: typeof status === 'string' ? status : undefined,
        exit_code: exitRaw !== undefined ? Number(exitRaw) : undefined
      } as PipelineRun;
    })
    .sort((a, b) => new Date(b.start_utc).getTime() - new Date(a.start_utc).getTime());

  addTrends(sorted);
  return sorted;
}

function humanizeSeconds(total: number): string {
  if (total < 60) return `${Math.round(total)}s`;
  const m = Math.floor(total / 60);
  const s = Math.round(total % 60);
  return `${m}m ${s}s`;
}

function addTrends(runs: PipelineRun[]) {
  const byName: Record<string, PipelineRun[]> = {};
  for (const r of runs) {
    const key = r.pipeline_name;
    if (!byName[key]) byName[key] = [];
    (byName[key] as PipelineRun[]).push(r);
  }
  for (const name of Object.keys(byName)) {
    const group = byName[name];
    if (!group || group.length === 0) continue;
    for (let i = 0; i < group.length; i++) {
      const cur = group[i];
      if (!cur) continue;
      if (i === group.length - 1) {
        cur.trend = 'flat';
        continue;
      }
      const prev = group[i + 1];
      if (!prev) {
        cur.trend = 'flat';
        continue;
      }
      if (cur.elapsed_seconds > prev.elapsed_seconds * 1.1) cur.trend = 'up';
      else if (cur.elapsed_seconds < prev.elapsed_seconds * 0.9) cur.trend = 'down';
      else cur.trend = 'flat';
    }
  }
}