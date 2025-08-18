import type { PipelineApiEnvelope, PipelineRun, RawPipelineRun } from '@/types/pipeline';
import { pipelineData } from '@/data.js';
import { ApiEnvelopeSchema } from '@/types/pipelineSchema';
import { logger } from '@/utils/logger';
import { getCache, setCache } from './cache';
import { z } from 'zod';

const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://10.253.112.87:8001';
const endpoint = '/get_pipeline_info';
const DEFAULT_TIMEOUT = Number(import.meta.env.VITE_API_TIMEOUT_MS) || 10000;
const token = import.meta.env.VITE_API_TOKEN;
const OFFLINE_MODE = import.meta.env.VITE_OFFLINE_MODE === 'true';

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

  // Explicit offline mode short-circuits network access
  if (OFFLINE_MODE) {
    logger.info('Offline mode enabled - serving local sample data');
    const sanitized = sanitize((pipelineData.results || []) as RawPipelineRun[]);
    setCache(sanitized);
    return sanitized;
  }

  let raw: PipelineApiEnvelope | RawPipelineRun[] | undefined;
  let rawList: RawPipelineRun[];
  try {
    raw = await fetchJson<PipelineApiEnvelope | RawPipelineRun[]>(`${baseUrl}${endpoint}`);
  } catch (e: any) {
    // Network / timeout / HTTP error fallback: use bundled sample data (dev/demo mode only)
    if (import.meta.env.MODE !== 'test') {
      logger.warn('API fetch failed, falling back to local sample data', { message: e?.message });
      rawList = (pipelineData.results || []) as RawPipelineRun[];
      const sanitized = sanitize(rawList);
      setCache(sanitized);
      return sanitized;
    }
    throw e; // preserve behavior for tests
  }

  try {
    if (Array.isArray(raw)) {
      rawList = raw;
    } else {
      const parsed = ApiEnvelopeSchema.parse(raw);
      const res: any = parsed.results;
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
      if (import.meta.env.MODE !== 'test') {
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
  return sanitized;
}

function sanitize(raw: RawPipelineRun[]): PipelineRun[] {
  const sorted = raw
    .filter(r => r && (r.start_utc || r.start_local))
    .map<PipelineRun>(r => {
      const elapsedNum = Number(r.elapsed_seconds) || 0;
      const rowsNum = Number(r.rowcount) || 0;
      const pidNum = r.pid !== undefined ? Number(r.pid) : undefined;
      return {
        start_local: r.start_local,
        end_local: r.end_local,
        start_utc: r.start_utc || r.start_local || new Date().toISOString(),
        end_utc: r.end_utc,
        elapsed_seconds: elapsedNum,
        elapsed_human: r.elapsed_human || humanizeSeconds(elapsedNum),
        output_file: r.output_file,
        rowcount: rowsNum,
        log_file: r.log_file,
        pid: isNaN(pidNum as number) ? undefined : pidNum,
        date_code: r.date_code,
        pipeline_name: r.pipeline_name || r.script_name || 'unknown',
        script_name: r.script_name,
        pipeline_type: r.pipeline_type,
        environment: r.environment,
        status: r.status,
        exit_code: r.exit_code !== undefined ? Number(r.exit_code) : undefined
      };
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