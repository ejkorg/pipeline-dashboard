import { z } from 'zod';

export const RawPipelineSchema = z.object({
    start_local: z.string().optional(),
    end_local: z.string().optional(),
    start_utc: z.string().optional(),
    end_utc: z.string().optional(),
    elapsed_seconds: z.union([z.number(), z.string()]).optional(),
    elapsed_human: z.string().optional(),
    output_file: z.string().optional(),
    rowcount: z.union([z.number(), z.string()]).optional(),
    log_file: z.string().optional(),
    pid: z.union([z.number(), z.string()]).optional(),
    date_code: z.string().optional(),
    pipeline_name: z.string().optional(),
    script_name: z.string().optional(),
    pipeline_type: z.string().optional(),
    environment: z.string().nullable().optional(),
    status: z.string().optional(),
    exit_code: z.union([z.number(), z.string()]).optional()
});

export const ApiEnvelopeSchema = z.object({
    results: z.array(RawPipelineSchema).optional()
}).passthrough();

export type RawPipelineParsed = z.infer<typeof RawPipelineSchema>;