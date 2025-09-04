import type { PipelineRun, RawPipelineRun } from '@/types/pipeline';

// Converts a raw pipeline object (possibly containing strings for numbers or nulls)
// into a normalized PipelineRun with required defaults.
export function normalizePipeline(raw: RawPipelineRun): PipelineRun {
  const elapsedNum = Number(raw.elapsed_seconds) || 0;
  const rowsNum = Number(raw.rowcount) || 0;
  const pidNum = raw.pid !== undefined ? Number(raw.pid) : undefined;
  // Support common alias keys for archived file paths to avoid losing data
  const archivedFile =
    raw.archived_file ||
    (raw as any).archived ||
    (raw as any).archive_file ||
    (raw as any).archive_path ||
    (raw as any).archived_path ||
    (raw as any).archivePath ||
    (raw as any).archivedPath ||
    (raw as any).archive_file_path ||
    (raw as any).archived_file_path ||
    (raw as any).archiveFile ||
    (raw as any).archivedFile ||
    undefined;
  return {
    start_local: raw.start_local || undefined,
    end_local: raw.end_local || undefined,
    start_utc: raw.start_utc || raw.start_local || new Date().toISOString(),
    end_utc: raw.end_utc || undefined,
    elapsed_seconds: elapsedNum,
    elapsed_human: raw.elapsed_human || humanizeSeconds(elapsedNum),
    output_file: raw.output_file || undefined,
    rowcount: rowsNum,
    log_file: raw.log_file || undefined,
    archived_file: archivedFile || undefined,
    pid: isNaN(pidNum as number) ? undefined : pidNum,
    date_code: raw.date_code || undefined,
    pipeline_name: raw.pipeline_name || raw.script_name || 'unknown',
    script_name: raw.script_name || undefined,
    pipeline_type: raw.pipeline_type || undefined,
    environment: raw.environment ?? undefined,
    status: raw.status || undefined,
    exit_code: raw.exit_code !== undefined ? Number(raw.exit_code) : undefined,
    trend: undefined
  };
}

export function normalizePipelines(list: RawPipelineRun[] | PipelineRun[]): PipelineRun[] {
  return (list as RawPipelineRun[])
    .filter(r => r && (r.start_utc || r.start_local))
    .map(r => normalizePipeline(r as RawPipelineRun))
    .sort((a, b) => new Date(b.start_utc).getTime() - new Date(a.start_utc).getTime());
}

function humanizeSeconds(total: number): string {
  if (total < 60) return `${Math.round(total)}s`;
  const m = Math.floor(total / 60);
  const s = Math.round(total % 60);
  return `${m}m ${s}s`;
}
