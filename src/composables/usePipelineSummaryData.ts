import type { Ref } from 'vue';
import { ref } from 'vue';
import { pipelineSummaryData } from '@/pipeline_summary_data.js';
import { logger } from '@/utils/logger';

export interface PipelineSummary {
	pipeline_name: string;
	script_name: string;
	pipeline_type: string;
	environment: string | null;
	total_runs: number;
	last_run: string;
	avg_duration: number;
	avg_rowcount: number;
}

// Type for the imported summary data
type PipelineSummaryRaw = {
	pipeline_name: string;
	script_name: string | null;
	pipeline_type: string | null;
	environment: string | null;
	total_runs: number;
	last_run: string;
	avg_duration: number;
	avg_rowcount: number;
};

const baseUrl = import.meta.env.VITE_API_BASE_URL || '/pipeline-service';
// Make the summary endpoint configurable to match the pattern used in pipelineApi.ts
const summaryEndpoint = import.meta.env['VITE_API_SUMMARY_ENDPOINT'] || '/pipelines';
const DEFAULT_TIMEOUT = Number(import.meta.env.VITE_API_TIMEOUT_MS) || 10000;
const OFFLINE_MODE = import.meta.env.VITE_OFFLINE_MODE === 'true';
const STRICT_NO_FALLBACK = import.meta.env['VITE_STRICT_NO_FALLBACK'] === 'true';

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
	const resp = await fetchWithTimeout(url);
  if (!resp.ok) throw new Error(`HTTP ${resp.status} ${resp.statusText}`);
  return (await resp.json()) as T;
}

export function usePipelineSummaryData(): {
	summaries: Ref<PipelineSummary[]>;
	loading: Ref<boolean>;
	error: Ref<string | null>;
	fetchSummaries: () => Promise<void>;
} {
	const summaries = ref<PipelineSummary[]>([]);
	const loading = ref(false);
	const error = ref<string | null>(null);

	async function fetchSummaries() {
		loading.value = true;
		error.value = null;
		try {
			// Use mock data from pipeline_summary_data.js if VITE_USE_MOCK_DATA is set
			if (import.meta.env['VITE_USE_MOCK_DATA'] === 'true') {
				logger.info('Mock mode enabled - serving mock summary data from pipeline_summary_data.js');
				summaries.value = pipelineSummaryData.pipelines.map((p: PipelineSummaryRaw) => ({
					...p,
					script_name: p.script_name ?? '',
					pipeline_type: p.pipeline_type ?? '',
					environment: p.environment ?? null
				}));
				return;
			}

			// Explicit offline mode short-circuits network access
			if (OFFLINE_MODE) {
				logger.info('Offline mode enabled - serving local summary sample data');
				summaries.value = pipelineSummaryData.pipelines.map((p: PipelineSummaryRaw) => ({
					...p,
					script_name: p.script_name ?? '',
					pipeline_type: p.pipeline_type ?? '',
					environment: p.environment ?? null
				}));
				return;
			}

			// Fetch from API with proper error handling
			const data = await fetchJson<{ pipelines: PipelineSummaryRaw[] }>(`${baseUrl}${summaryEndpoint}`);
			summaries.value = data.pipelines.map((p: PipelineSummaryRaw) => ({
				...p,
				script_name: p.script_name ?? '',
				pipeline_type: p.pipeline_type ?? '',
				environment: p.environment ?? null
			}));

		} catch (e: any) {
			// Network / timeout / HTTP error fallback: use bundled sample data (dev/demo mode only)
			if (import.meta.env.MODE !== 'test' && !STRICT_NO_FALLBACK) {
				logger.warn('Summary API fetch failed, falling back to local sample data', { message: e?.message });
				summaries.value = pipelineSummaryData.pipelines.map((p: PipelineSummaryRaw) => ({
					...p,
					script_name: p.script_name ?? '',
					pipeline_type: p.pipeline_type ?? '',
					environment: p.environment ?? null
				}));
				error.value = `Using fallback data: ${e?.message || 'Network error'}`;
			} else {
				error.value = e?.message || 'Failed to fetch pipeline summaries';
			}
		} finally {
			loading.value = false;
		}
	}

	return { summaries, loading, error, fetchSummaries };
}
