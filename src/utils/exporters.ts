import type { PipelineRun } from '@/types/pipeline';

export function exportJSON(runs: PipelineRun[]) {
    const blob = new Blob([JSON.stringify(runs, null, 2)], { type: 'application/json' });
    downloadBlob(blob, 'pipelines.json');
}

export function exportCSV(runs: PipelineRun[]) {
    if (!runs.length) return;
    const headers = Object.keys(runs[0]) as (keyof PipelineRun)[];
    const lines = [
        headers.join(','),
        ...runs.map(r =>
            headers
                .map(h => {
                    const v = r[h];
                    if (v == null) return '';
                    const s = String(v).replace(/"/g, '""');
                    return /[",\n]/.test(s) ? `"${s}"` : s;
                })
                .join(',')
        )
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/csv' });
    downloadBlob(blob, 'pipelines.csv');
}

function downloadBlob(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}