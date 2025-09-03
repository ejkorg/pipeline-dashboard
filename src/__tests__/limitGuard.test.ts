import { describe, it, expect } from 'vitest';
import { LIMIT_MAX, buildEndpoint } from '@/services/pipelineApi';

describe('API Limit Guard', () => {
  it('exports LIMIT_MAX constant', () => {
    expect(LIMIT_MAX).toBe(1000);
  });

  it('clamps limit in buildEndpoint to LIMIT_MAX', () => {
    // Test normal case within limits
    const normal = buildEndpoint({ limit: 500, offset: 0, all_data: true });
    expect(normal).toContain('limit=500');

    // Test clamping when over limit
    const overLimit = buildEndpoint({ limit: 5000, offset: 0, all_data: true });
    expect(overLimit).toContain('limit=1000');
    expect(overLimit).not.toContain('limit=5000');

    // Test edge case at exact limit
    const atLimit = buildEndpoint({ limit: 1000, offset: 0, all_data: true });
    expect(atLimit).toContain('limit=1000');
  });

  it('handles edge cases in limit clamping', () => {
    // Test negative values get clamped to 0
    const negative = buildEndpoint({ limit: -10, offset: 0, all_data: true });
    expect(negative).toContain('limit=0');

    // Test floating point values get floored
    const float = buildEndpoint({ limit: 999.9, offset: 0, all_data: true });
    expect(float).toContain('limit=999');

    // Test over-limit float gets clamped to LIMIT_MAX
    const overFloat = buildEndpoint({ limit: 1500.7, offset: 0, all_data: true });
    expect(overFloat).toContain('limit=1000');
  });
});