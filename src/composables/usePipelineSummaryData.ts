import type { Ref } from 'vue';
import { ref } from 'vue';

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

import { pipelineSummaryData } from '@/pipeline_summary_data.js';

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
			if (import.meta.env['VITE_USE_MOCK_DATA'] === 'true') {
								 summaries.value = pipelineSummaryData.pipelines.map((p: PipelineSummaryRaw) => ({
									 ...p,
									 script_name: p.script_name ?? '',
									 pipeline_type: p.pipeline_type ?? '',
									 environment: p.environment ?? null
								 }));
				return;
			}
			const resp = await fetch(
				import.meta.env.VITE_API_BASE_URL + '/pipelines'
			);
			if (!resp.ok) throw new Error('Failed to fetch pipeline summaries');
			const data = await resp.json();
			summaries.value = data.pipelines;
		} catch (e: any) {
							 summaries.value = pipelineSummaryData.pipelines.map((p: PipelineSummaryRaw) => ({
								 ...p,
								 script_name: p.script_name ?? '',
								 pipeline_type: p.pipeline_type ?? '',
								 environment: p.environment ?? null
							 }));
			error.value = 'Using mock data: ' + (e.message || 'Unknown error');
		} finally {
			loading.value = false;
		}
	}

	return { summaries, loading, error, fetchSummaries };
}
// This file has been cleaned up and all content has been removed.
