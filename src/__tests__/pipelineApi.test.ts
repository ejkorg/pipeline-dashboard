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

    it('accepts alternative envelope key "data"', async () => {
        mockFetchSequence([
            {
                json: async () => ({
                    data: [
                        {
                            pipeline_name: 'FromData',
                            start_utc: new Date().toISOString(),
                            elapsed_seconds: 15,
                            rowcount: 9,
                        },
                    ],
                }),
            },
        ]);
        const { getPipelineInfo } = await freshApi();
        const out = await getPipelineInfo(true);
        expect(out).toHaveLength(1);
        expect(out[0]!.pipeline_name).toBe('FromData');
        expect(out[0]!.elapsed_seconds).toBe(15);
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
                    // Provide a clearly invalid type for results (number) so schema rejects
                    results: 123 as any,
                }),
            },
        ]);
        const { getPipelineInfo } = await freshApi();
        await expect(getPipelineInfo(true)).rejects.toThrow(/schema validation/i);
    });

    it('parses single object result into an array of length 1', async () => {
        const now = new Date().toISOString();
        mockFetchSequence([
            {
                json: async () => ({
                    results: {
                        pipeline_name: 'SingleObj',
                        start_utc: now,
                        elapsed_seconds: 5,
                        rowcount: 1,
                    },
                }),
            },
        ]);
        const { getPipelineInfo } = await freshApi();
        const data = await getPipelineInfo(true);
        expect(data).toHaveLength(1);
        expect(data[0]!.pipeline_name).toBe('SingleObj');
    });

    it('parses object map of results into an array', async () => {
        const now = Date.now();
        mockFetchSequence([
            {
                json: async () => ({
                    results: {
                        a: {
                            pipeline_name: 'MapA',
                            start_utc: new Date(now).toISOString(),
                            elapsed_seconds: 10,
                            rowcount: 2,
                        },
                        b: {
                            pipeline_name: 'MapB',
                            start_utc: new Date(now - 1000).toISOString(),
                            elapsed_seconds: 12,
                            rowcount: 3,
                        },
                    },
                }),
            },
        ]);
        const { getPipelineInfo } = await freshApi();
        const data = await getPipelineInfo(true);
        const names = data.map(r => r.pipeline_name).sort();
        expect(names).toEqual(['MapA', 'MapB']);
    });

    it('ignores extra pipelines array metadata while parsing results', async () => {
        const now = new Date().toISOString();
        mockFetchSequence([
            {
                json: async () => ({
                    pipelines: ['X', 'Y'],
                    results: [
                        {
                            pipeline_name: 'MetaTest',
                            start_utc: now,
                            elapsed_seconds: 1,
                            rowcount: 1,
                        },
                    ],
                }),
            },
        ]);
        const { getPipelineInfo } = await freshApi();
        const data = await getPipelineInfo(true);
        expect(data).toHaveLength(1);
        expect(data[0]!.pipeline_name).toBe('MetaTest');
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

describe('pipelineApi.buildEndpoint', () => {
    it('clamps limit to 1000 maximum', async () => {
        const { buildEndpoint } = await freshApi();
        const endpoint = buildEndpoint({ limit: 5000 });
        expect(endpoint).toBe('/get_pipeline_info?limit=1000&offset=0&all_data=true');
    });

    it('uses default limit of 100 when no limit provided', async () => {
        const { buildEndpoint } = await freshApi();
        const endpoint = buildEndpoint();
        expect(endpoint).toBe('/get_pipeline_info?limit=100&offset=0&all_data=true');
    });

    it('allows limit values within valid range', async () => {
        const { buildEndpoint } = await freshApi();
        const endpoint = buildEndpoint({ limit: 500 });
        expect(endpoint).toBe('/get_pipeline_info?limit=500&offset=0&all_data=true');
    });

    it('clamps minimum limit to 1', async () => {
        const { buildEndpoint } = await freshApi();
        const endpoint = buildEndpoint({ limit: -10 });
        expect(endpoint).toBe('/get_pipeline_info?limit=1&offset=0&all_data=true');
    });

    it('handles string limit values by converting and clamping', async () => {
        const { buildEndpoint } = await freshApi();
        const endpoint = buildEndpoint({ limit: '2000' as any });
        expect(endpoint).toBe('/get_pipeline_info?limit=1000&offset=0&all_data=true');
    });

    it('uses default values for offset and all_data when not provided', async () => {
        const { buildEndpoint } = await freshApi();
        const endpoint = buildEndpoint({ limit: 250 });
        expect(endpoint).toBe('/get_pipeline_info?limit=250&offset=0&all_data=true');
    });

    it('properly handles all parameters together', async () => {
        const { buildEndpoint } = await freshApi();
        const endpoint = buildEndpoint({ 
            limit: 800, 
            offset: 10, 
            all_data: false 
        });
        expect(endpoint).toBe('/get_pipeline_info?limit=800&offset=10&all_data=false');
    });
});