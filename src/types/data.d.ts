declare module '@/data' {
  import type { RawPipelineRun } from '@/types/pipeline';
  export const pipelineData: { total?: number; count?: number; results: RawPipelineRun[] };
}

declare module '@/pipeline_summary_data.js' {
  export interface PipelineSummaryData {
    pipelines: Array<{
      pipeline_name: string;
      script_name: string | null;
      pipeline_type: string | null;
      environment: string | null;
      total_runs: number;
      last_run: string;
      avg_duration: number;
      avg_rowcount: number;
    }>;
  }
  export const pipelineSummaryData: PipelineSummaryData;
}
