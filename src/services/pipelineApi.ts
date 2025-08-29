// Dummy pipeline data for mock mode
// Dummy data for offline/mock mode
export const DUMMY_PIPELINE_DATA = {
  "total": 259,
  "count": 259,
  "results": [
    {
      "start_local": "2025-08-28T22:07:01",
      "end_local": "2025-08-28T22:35:07",
      "start_utc": "2025-08-29T05:07:01Z",
      "end_utc": "2025-08-29T05:35:07Z",
      "elapsed_seconds": 1685.351,
      "elapsed_human": "28m 5s",
      "output_file": "/apps/exensio_data/reference_data/SubconLotRefData-20250828_220701.subconLot",
      "rowcount": 7662,
      "log_file": "/apps/exensio_data/reference_data/jag_test/log/getSubconLotRefData_LOTGDB.log",
      "pid": 73156,
      "date_code": "20250828_220701",
      "pipeline_name": "subcon_lotg_to_refdb_ingest",
      "script_name": "get_subcon_lot_ref_data_LOTGDB_rc10.py",
      "pipeline_type": "batch",
      "environment": "prod"
    },
    {
      "start_local": "2025-08-28T21:07:02",
      "end_local": "2025-08-28T21:29:03",
      "start_utc": "2025-08-29T04:07:02Z",
      "end_utc": "2025-08-29T04:29:03Z",
      "elapsed_seconds": 1321.16,
      "elapsed_human": "22m 1s",
      "output_file": "/apps/exensio_data/reference_data/SubconLotRefData-20250828_210702.subconLot",
      "rowcount": 6799,
      "log_file": "/apps/exensio_data/reference_data/jag_test/log/getSubconLotRefData_LOTGDB.log",
      "pid": 20702,
      "date_code": "20250828_210702",
      "pipeline_name": "subcon_lotg_to_refdb_ingest",
      "script_name": "get_subcon_lot_ref_data_LOTGDB_rc10.py",
      "pipeline_type": "batch",
      "environment": "prod"
    },
    {
      "start_local": "2025-08-28T20:07:02",
      "end_local": "2025-08-28T20:29:16",
      "start_utc": "2025-08-29T03:07:02Z",
      "end_utc": "2025-08-29T03:29:16Z",
      "elapsed_seconds": 1333.802,
      "elapsed_human": "22m 13s",
      "output_file": "/apps/exensio_data/reference_data/SubconLotRefData-20250828_200702.subconLot",
      "rowcount": 6799,
      "log_file": "/apps/exensio_data/reference_data/jag_test/log/getSubconLotRefData_LOTGDB.log",
      "pid": 59209,
      "date_code": "20250828_200702",
      "pipeline_name": "subcon_lotg_to_refdb_ingest",
      "script_name": "get_subcon_lot_ref_data_LOTGDB_rc10.py",
      "pipeline_type": "batch",
      "environment": "prod"
    }
    // ...add more as needed for testing...
  ],
  "pipelines": [
    "subcon_lot_ref_data",
    "get_subcon_lot_ref_data_LOTGDB_rc8.py",
    "get_subcon_lot_ref_data_LOTGDB_rc7.py",
    "get_subcon_lot_ref_data_LOTGDB_rc10.py",
    "subcon_lotg_to_FT_refdb_ingest",
    "subcon_lotg_to_refdb_ingest",
    "get_subcon_lot_ref_data_LOTGDB",
    "unknown",
    "get_subcon_lot_ref_data_LOTGDB_rc9.py"
  ]
};
import type { PipelineApiEnvelope, PipelineRun, RawPipelineRun } from '@/types/pipeline';
import { pipelineData } from '@/data.js';
import { ApiEnvelopeSchema } from '@/types/pipelineSchema';
import { logger } from '@/utils/logger';
import { getCache, setCache } from './cache';
import { z } from 'zod';

const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://10.253.112.87:8001';
// Make the endpoint path configurable to adapt to backend changes without code edits
const endpoint = import.meta.env.VITE_API_ENDPOINT_PATH || '/get_pipeline_info';
const DEFAULT_TIMEOUT = Number(import.meta.env.VITE_API_TIMEOUT_MS) || 10000;
const token = import.meta.env.VITE_API_TOKEN;
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
  const resp = await fetchWithTimeout(url, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined
  });
  if (!resp.ok) throw new Error(`HTTP ${resp.status} ${resp.statusText}`);
  return (await resp.json()) as T;
}

export async function getPipelineInfo(force = false): Promise<PipelineRun[]> {
  if (!force) {
    const cached = getCache();
    if (cached) return cached;
  }

  // Use dummy data if VITE_USE_MOCK_DATA is set, or fallback to offline mode
  if (import.meta.env['VITE_USE_MOCK_DATA'] === 'true') {
    logger.info('Mock mode enabled - serving dummy pipeline data');
    const sanitized = sanitize((DUMMY_PIPELINE_DATA.results || []) as RawPipelineRun[]);
    setCache(sanitized);
    emitSource('offline');
    return sanitized;
  }
  // Explicit offline mode short-circuits network access
  if (OFFLINE_MODE) {
    logger.info('Offline mode enabled - serving local sample data');
    const sanitized = sanitize((pipelineData.results || []) as RawPipelineRun[]);
    setCache(sanitized);
    emitSource('offline');
    return sanitized;
  }

  let raw: PipelineApiEnvelope | RawPipelineRun[] | undefined;
  let rawList: RawPipelineRun[];
  try {
    raw = await fetchJson<PipelineApiEnvelope | RawPipelineRun[]>(`${baseUrl}${endpoint}`);
  } catch (e: any) {
    // Network / timeout / HTTP error fallback: use bundled sample data (dev/demo mode only)
    if (import.meta.env.MODE !== 'test' && !STRICT_NO_FALLBACK) {
      logger.warn('API fetch failed, falling back to local sample data', { message: e?.message });
      rawList = (pipelineData.results || []) as RawPipelineRun[];
      const sanitized = sanitize(rawList);
      setCache(sanitized);
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
  setCache(sanitized);
  emitSource('live');
  return sanitized;
}

function sanitize(raw: RawPipelineRun[]): PipelineRun[] {
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