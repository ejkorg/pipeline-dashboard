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
    pid: z.union([z.number(), z.string()]).nullable().optional(),
    date_code: z.string().nullable().optional(),
    pipeline_name: z.string().nullable().optional(),
    script_name: z.string().nullable().optional(),
    pipeline_type: z.string().nullable().optional(),
    environment: z.string().nullable().optional(),
    status: z.string().nullable().optional(),
    exit_code: z.union([z.number(), z.string()]).nullable().optional()
});

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
    pipelines: z.array(z.string()).optional()
}).passthrough();

export type RawPipelineParsed = z.infer<typeof RawPipelineSchema>;