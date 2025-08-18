export interface RawPipelineRun {
  start_local?: string;
  end_local?: string;
  start_utc?: string;
  end_utc?: string;
  elapsed_seconds?: number | string;
  elapsed_human?: string;
  output_file?: string;
  rowcount?: number | string;
  log_file?: string;
  pid?: number | string;
  date_code?: string;
  pipeline_name?: string;
  script_name?: string;
  pipeline_type?: string;
  environment?: string | null;
  status?: string;
  exit_code?: number | string;
}

export interface PipelineRun {
  start_local?: string;
  end_local?: string;
  start_utc: string;
  end_utc?: string;
  elapsed_seconds: number;
  elapsed_human?: string;
  output_file?: string;
  rowcount: number;
  log_file?: string;
  pid?: number;
  date_code?: string;
  pipeline_name: string;
  script_name?: string;
  pipeline_type?: string;
  environment?: string | null;
  status?: string;
  exit_code?: number;
  trend?: 'up' | 'down' | 'flat';
}

export interface PipelineApiEnvelope {
  results?: RawPipelineRun[];
  total?: number;
  count?: number;
  [k: string]: unknown;
}