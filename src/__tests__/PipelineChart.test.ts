import { mount } from '@vue/test-utils';
import PipelineChart from '../components/PipelineChart.vue';
import { describe, it, expect } from 'vitest';

describe('PipelineChart.vue', () => {
  const makeRun = (id: string, extra: any = {}) => ({
    pid: id,
    start_utc: new Date(2023, 0, +id + 1, 12, 0, 0).toISOString(),
    elapsed_seconds: Number(id) * 10,
    pipeline_name: 'TestPipe',
    ...extra
  });

  it('shows the latest 30 runs by default', () => {
    const runs = Array.from({ length: 40 }, (_, i) => makeRun(String(i + 1)));
    const wrapper = mount(PipelineChart, {
      props: { pipelines: runs }
    });
    const chartData = wrapper.vm['chartData'];
    expect(chartData.labels.length).toBe(30);
    // Newest at index 0, oldest at index 29
    expect(chartData.labels[0]).toContain('01/31');
    expect(chartData.labels[29]).toContain('01/02');
  });

  it('always includes selected runs, even if not in latest 30', () => {
    const runs = Array.from({ length: 40 }, (_, i) => makeRun(String(i + 1)));
    // Select id 1 (oldest)
    const wrapper = mount(PipelineChart, {
      props: { pipelines: runs, selectedKeys: ['1'] }
    });
    const chartData = wrapper.vm['chartData'];
    expect(chartData.labels.some((l: string) => l.includes('01/02'))).toBe(true);
    expect(chartData.labels.length).toBe(30);
  });

  it('fills up to 30 with most recent unselected runs', () => {
    const runs = Array.from({ length: 10 }, (_, i) => makeRun(String(i + 1)));
    const wrapper = mount(PipelineChart, {
      props: { pipelines: runs }
    });
    const chartData = wrapper.vm['chartData'];
    expect(chartData.labels.length).toBe(10);
  });
});
