declare module '@/data.js' {
  import type { RawPipelineRun } from '@/types/pipeline';
  export const pipelineData: { total?: number; count?: number; results: RawPipelineRun[] };
}
