import { z } from 'zod';

// Base run schema (relaxed to allow null for some string fields that occasionally appear as null)
export const RawPipelineSchema = z.object({
    start_local: z.string().nullable().optional(),
    end_local: z.string().nullable().optional(),
    start_utc: z.string().nullable().optional(),
    end_utc: z.string().nullable().optional(),
    elapsed_seconds: z.union([z.number(), z.string()]).nullable().optional(),
    elapsed_human: z.string().nullable().optional(),
    output_file: z.string().nullable().optional(),
    rowcount: z.union([z.number(), z.string()]).nullable().optional(),
    log_file: z.string().nullable().optional(),
    archived_file: z.string().nullable().optional(),
    pid: z.union([z.number(), z.string()]).nullable().optional(),
    date_code: z.string().nullable().optional(),
    pipeline_name: z.string().nullable().optional(),
    script_name: z.string().nullable().optional(),
    pipeline_type: z.string().nullable().optional(),
    environment: z.string().nullable().optional(),
    status: z.string().nullable().optional(),
    exit_code: z.union([z.number(), z.string()]).nullable().optional(),
    // Additional fields from API
    metadata: z.record(z.any()).nullable().optional(),
    benchmark: z.record(z.any()).nullable().optional(),
    out_files: z.array(z.any()).nullable().optional(),
    output_files_gen: z.array(z.string()).nullable().optional(),
    output_files_trace: z.array(z.string()).nullable().optional(),
    archived_gen_files: z.array(z.string()).nullable().optional(),
    archived_trace_files: z.array(z.string()).nullable().optional(),
    total_files: z.number().nullable().optional(),
    file_type_counts: z.record(z.any()).nullable().optional(),
    file_type_rows: z.record(z.any()).nullable().optional(),
    rows_extracted: z.number().nullable().optional(),
    rows_written: z.number().nullable().optional(),
    hostname: z.string().nullable().optional(),
    run_args: z.string().nullable().optional(),
    error_message: z.string().nullable().optional(),
    output_file_gen: z.string().nullable().optional(),
    output_file_trace: z.string().nullable().optional()
}).passthrough();


// Flexible results container: array OR object map OR single object.
// Order matters: the single-object schema is very permissive (all fields optional),
// so we put the map form before it to avoid treating a map as a single run.
const FlexibleResults = z.union([
    z.array(RawPipelineSchema),
    z.record(RawPipelineSchema), // map of arbitrary keys to runs
    RawPipelineSchema // single result object
]);

export const ApiEnvelopeSchema = z.object({
    results: FlexibleResults.optional(),
    // Accept common alternative envelope keys used by updated services
    data: FlexibleResults.optional(),
    items: FlexibleResults.optional(),
    pipelines: z.array(z.string()).optional()
}).passthrough();

export type RawPipelineParsed = z.infer<typeof RawPipelineSchema>;