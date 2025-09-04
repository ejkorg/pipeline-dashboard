import { describe, it, expect } from 'vitest';
import { normalizePipeline, normalizePipelines } from '@/utils/normalizePipeline';
import type { RawPipelineRun } from '@/types/pipeline';

describe('normalizePipeline', () => {
  it('fills defaults and coerces numbers', () => {
    const raw: RawPipelineRun = {
      start_utc: '2024-01-01T00:00:00Z',
      elapsed_seconds: '42',
      rowcount: '1000',
      pipeline_name: 'demo'
    };
    const p = normalizePipeline(raw);
    expect(p.elapsed_seconds).toBe(42);
    expect(p.rowcount).toBe(1000);
    expect(p.pipeline_name).toBe('demo');
  });

  it('derives pipeline_name from script_name', () => {
    const p = normalizePipeline({ script_name: 'scriptA' });
    expect(p.pipeline_name).toBe('scriptA');
  });

  it('maps archived file aliases to archived_file', () => {
    const p1 = normalizePipeline({ start_utc: '2024-01-01T00:00:00Z', pipeline_name: 'x', archived_file: '/a.gz' });
    const p2 = normalizePipeline({ start_utc: '2024-01-01T00:00:00Z', pipeline_name: 'x', archived: '/b.gz' } as any);
    const p3 = normalizePipeline({ start_utc: '2024-01-01T00:00:00Z', pipeline_name: 'x', archive_path: '/c.gz' } as any);
    const p4 = normalizePipeline({ start_utc: '2024-01-01T00:00:00Z', pipeline_name: 'x', archivedFile: '/d.gz' } as any);
    expect(p1.archived_file).toBe('/a.gz');
    expect(p2.archived_file).toBe('/b.gz');
    expect(p3.archived_file).toBe('/c.gz');
    expect(p4.archived_file).toBe('/d.gz');
  });
});

describe('normalizePipelines', () => {
  it('sorts by start_utc desc', () => {
    const list = normalizePipelines([
      { start_utc: '2024-01-02T00:00:00Z', pipeline_name: 'b' },
      { start_utc: '2024-01-03T00:00:00Z', pipeline_name: 'c' },
      { start_utc: '2024-01-01T00:00:00Z', pipeline_name: 'a' }
    ] as RawPipelineRun[]);
    expect(list.map(p => p.pipeline_name)).toEqual(['c', 'b', 'a']);
  });
});
