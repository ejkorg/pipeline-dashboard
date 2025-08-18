import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

type FetchMock = ReturnType<typeof vi.fn>;

function mockFetchSequence(responses: Array<Partial<Response> & { json?: () => any }>) {
    (global.fetch as FetchMock) = vi.fn().mockImplementation(() => {
        const next = responses.shift();
        if (!next) {
            return Promise.reject(new Error('Unexpected extra fetch call'));
        }
        if (next instanceof Error) {
            return Promise.reject(next);
        }
        const {
            ok = true,
            status = 200,
            statusText = 'OK',
            json = async () => ({}),
        } = next;
        return Promise.resolve({
            ok,
            status,
            statusText,
            json,
        } as unknown as Response);
    });
}

async function freshApi() {
    // Ensures cache & module state are reset
    vi.resetModules();
    return await import('@/services/pipelineApi');
}

beforeEach(() => {
    vi.useRealTimers();
    (global.fetch as any) = vi.fn();
});

afterEach(() => {
    vi.clearAllMocks();
});

describe('pipelineApi.getPipelineInfo', () => {
    it('parses and returns runs from enveloped response', async () => {
        mockFetchSequence([
            {
                json: async () => ({
                    results: [
                        {
                            pipeline_name: 'A',
                            start_utc: new Date().toISOString(),
                            elapsed_seconds: 10,
                            rowcount: 5,
                        },
                    ],
                }),
            },
        ]);

        const { getPipelineInfo } = await freshApi();
    const data = await getPipelineInfo(true); // force fetch
    expect(data.length).toBe(1);
    const first = data[0]!;
    expect(first.pipeline_name).toBe('A');
    expect(first.elapsed_seconds).toBe(10);
    });

    it('handles root array response (no envelope)', async () => {
        mockFetchSequence([
            {
                json: async () => [
                    {
                        pipeline_name: 'B',
                        start_utc: new Date().toISOString(),
                        elapsed_seconds: 3,
                        rowcount: 1,
                    },
                ],
            },
        ]);
        const { getPipelineInfo } = await freshApi();
    const data = await getPipelineInfo(true);
    expect(data.length).toBe(1);
    expect(data[0]!.pipeline_name).toBe('B');
    });

    it('coerces numeric strings & fills fallback pipeline_name', async () => {
        mockFetchSequence([
            {
                json: async () => ({
                    results: [
                        {
                            script_name: 'script_x.py',
                            start_utc: new Date().toISOString(),
                            elapsed_seconds: '42',
                            rowcount: '7',
                        },
                    ],
                }),
            },
        ]);
        const { getPipelineInfo } = await freshApi();
    const data = await getPipelineInfo(true);
    const rec = data[0]!;
    expect(rec.pipeline_name).toBe('script_x.py');
    expect(rec.elapsed_seconds).toBe(42);
    expect(rec.rowcount).toBe(7);
    });

    it('applies caching (second call without force does not refetch)', async () => {
        mockFetchSequence([
            {
                json: async () => ({
                    results: [
                        {
                            pipeline_name: 'CacheTest',
                            start_utc: new Date().toISOString(),
                            elapsed_seconds: 5,
                            rowcount: 2,
                        },
                    ],
                }),
            },
        ]);
        const { getPipelineInfo } = await freshApi();
    const first = await getPipelineInfo(true); // fetch
    const second = await getPipelineInfo(); // should serve from cache
    expect(first.length).toBeGreaterThan(0);
    expect(second.length).toBeGreaterThan(0);
    expect(first[0]!.pipeline_name).toBe('CacheTest');
    expect(second[0]!.pipeline_name).toBe('CacheTest');
        expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it('bypasses cache when force = true', async () => {
        mockFetchSequence([
            {
                json: async () => ({
                    results: [
                        {
                            pipeline_name: 'Initial',
                            start_utc: new Date().toISOString(),
                            elapsed_seconds: 1,
                            rowcount: 1,
                        },
                    ],
                }),
            },
            {
                json: async () => ({
                    results: [
                        {
                            pipeline_name: 'Forced',
                            start_utc: new Date().toISOString(),
                            elapsed_seconds: 2,
                            rowcount: 2,
                        },
                    ],
                }),
            },
        ]);
        const { getPipelineInfo } = await freshApi();
    const first = await getPipelineInfo(true);
    const second = await getPipelineInfo(true); // force again
    expect(first[0]!.pipeline_name).toBe('Initial');
    expect(second[0]!.pipeline_name).toBe('Forced');
        expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    it('propagates network error (no auto retry implemented)', async () => {
        (global.fetch as FetchMock) = vi.fn().mockRejectedValueOnce(new Error('Network down'));
        const { getPipelineInfo } = await freshApi();
        await expect(getPipelineInfo(true)).rejects.toThrow('Network down');
    });

    it('throws on non-ok HTTP response', async () => {
        mockFetchSequence([
            {
                ok: false,
                status: 500,
                statusText: 'Internal Server Error',
                json: async () => ({}),
            },
        ]);
        const { getPipelineInfo } = await freshApi();
        await expect(getPipelineInfo(true)).rejects.toThrow(/HTTP 500/);
    });

    it('throws on schema validation failure (malformed results field)', async () => {
        mockFetchSequence([
            {
                json: async () => ({
                    results: { not: 'an array' }, // invalid
                }),
            },
        ]);
        const { getPipelineInfo } = await freshApi();
        await expect(getPipelineInfo(true)).rejects.toThrow(/schema validation/i);
    });

    it('assigns trend values (up/down/flat) based on elapsed differences', async () => {
        // Provide two runs for same pipeline so trend logic can compare
        const now = Date.now();
        mockFetchSequence([
            {
                json: async () => ({
                    results: [
                        {
                            pipeline_name: 'Trend',
                            start_utc: new Date(now).toISOString(),
                            elapsed_seconds: 110,
                            rowcount: 1,
                        },
                        {
                            pipeline_name: 'Trend',
                            start_utc: new Date(now - 60000).toISOString(),
                            elapsed_seconds: 90,
                            rowcount: 1,
                        },
                    ],
                }),
            },
        ]);
        const { getPipelineInfo } = await freshApi();
        const data = await getPipelineInfo(true);

        const first = data.find(r => r.elapsed_seconds === 110);
        expect(first?.trend).toBe('up'); // 110 > 90 * 1.1 => up
        const second = data.find(r => r.elapsed_seconds === 90);
        expect(second?.trend).toBeDefined(); // the older one should have some trend (probably flat or calculated)
    });
});