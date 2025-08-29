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

const MOCK_PIPELINE_SUMMARY = {
	"pipelines": [
		{ "pipeline_name": "subcon_lotg_to_refdb_ingest", "script_name": "get_subcon_lot_ref_data_LOTGDB_rc10.py", "pipeline_type": "batch", "environment": "prod", "total_runs": 23, "last_run": "2025-08-29T05:07:01Z", "avg_duration": 1519.8245652173914, "avg_rowcount": 7008.95652173913 },
		{ "pipeline_name": "subcon_lotg_to_FT_refdb_ingest", "script_name": "get_subcon_Flot_ref_data_LOTGDB_rc1.py", "pipeline_type": "batch", "environment": "prod", "total_runs": 2, "last_run": "2025-08-28T07:21:48Z", "avg_duration": 66.9465, "avg_rowcount": 35340.5 },
		{ "pipeline_name": "get_subcon_lot_ref_data_LOTGDB_rc10.py", "script_name": "get_subcon_lot_ref_data_LOTGDB_rc10.py", "pipeline_type": "batch", "environment": "prod", "total_runs": 121, "last_run": "2025-08-20T09:07:02Z", "avg_duration": 1339.718297520661, "avg_rowcount": 6540.9504132231405 },
		{ "pipeline_name": "get_subcon_lot_ref_data_LOTGDB_rc9.py", "script_name": "get_subcon_lot_ref_data_LOTGDB_rc9.py", "pipeline_type": "batch", "environment": "prod", "total_runs": 1, "last_run": "2025-08-15T04:44:08Z", "avg_duration": 2434.503, "avg_rowcount": 8544 },
		{ "pipeline_name": "get_subcon_lot_ref_data_LOTGDB_rc8.py", "script_name": "get_subcon_lot_ref_data_LOTGDB_rc8.py", "pipeline_type": "batch", "environment": "prod", "total_runs": 1, "last_run": "2025-08-14T05:10:11Z", "avg_duration": 2090.318, "avg_rowcount": 8544 },
		{ "pipeline_name": "get_subcon_lot_ref_data_LOTGDB_rc7.py", "script_name": "get_subcon_lot_ref_data_LOTGDB_rc7.py", "pipeline_type": "batch", "environment": "prod", "total_runs": 4, "last_run": "2025-08-13T06:48:47Z", "avg_duration": 2320.1695, "avg_rowcount": 7889.5 },
		{ "pipeline_name": "subcon_lot_ref_data", "script_name": "get_subcon_lot_ref_data_LOTGDB_rc4.py", "pipeline_type": "batch", "environment": "prod", "total_runs": 1, "last_run": "2025-08-12T08:59:08Z", "avg_duration": 2636.745, "avg_rowcount": 9384 },
		{ "pipeline_name": "subcon_lot_ref_data", "script_name": "get_subcon_lot_ref_data_LOTGDB_rc5.py", "pipeline_type": "batch", "environment": "prod", "total_runs": 2, "last_run": "2025-08-12T01:14:17Z", "avg_duration": 2285.5975, "avg_rowcount": 6690 },
		{ "pipeline_name": "get_subcon_lot_ref_data_LOTGDB", "script_name": "get_subcon_lot_ref_data_LOTGDB_rc4.py", "pipeline_type": "batch", "environment": "prod", "total_runs": 1, "last_run": "2025-08-11T08:03:53Z", "avg_duration": 2273.563, "avg_rowcount": 6850 },
		{ "pipeline_name": "unknown", "script_name": "", "pipeline_type": "", "environment": null, "total_runs": 103, "last_run": "2025-08-05T01:51:27Z", "avg_duration": 1177.2129514563105, "avg_rowcount": 3323.2912621359224 }
	]
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
				summaries.value = MOCK_PIPELINE_SUMMARY.pipelines.map((p) => ({
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
			summaries.value = MOCK_PIPELINE_SUMMARY.pipelines.map((p) => ({
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
