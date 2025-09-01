import { mount } from '@vue/test-utils';
import RowCountChart from '../components/RowCountChart.vue';
import { describe, it, expect } from 'vitest';

describe('RowCountChart.vue', () => {
  const makeRun = (id: string, extra: any = {}) => ({
    pid: id,
    start_utc: new Date(2023, 0, +id + 1, 12, 0, 0).toISOString(),
    rowcount: Number(id) * 100,
    pipeline_name: 'TestPipe',
    ...extra
  });

  it('shows the latest 30 runs by default', () => {
    const runs = Array.from({ length: 40 }, (_, i) => makeRun(String(i + 1)));
    const wrapper = mount(RowCountChart, {
      props: { pipelines: runs }
    });
  const chartData = (wrapper.vm as any)['chartData'];
    expect(chartData.labels.length).toBe(30);
  // Oldest of the 30 at index 0, newest at index 29
  // For id 31: new Date(2023, 0, 32, 12, 0, 0) => '01/31 12:00'
  // For id 1: new Date(2023, 0, 2, 12, 0, 0) => '01/02 12:00'
  expect(chartData.labels[0]).toContain('01/31');
  expect(chartData.labels[29]).toContain('01/02');
  });

  it('always includes selected runs, even if not in latest 30', () => {
    const runs = Array.from({ length: 40 }, (_, i) => makeRun(String(i + 1)));
    // Select id 1 (oldest)
    const wrapper = mount(RowCountChart, {
      props: { pipelines: runs, selectedKeys: ['1'] }
    });
  const chartData = (wrapper.vm as any)['chartData'];
  expect(chartData.labels.some((l: string) => l.includes('01/02'))).toBe(true);
    expect(chartData.labels.length).toBe(30);
  });

  it('fills up to 30 with most recent unselected runs', () => {
    const runs = Array.from({ length: 10 }, (_, i) => makeRun(String(i + 1)));
    const wrapper = mount(RowCountChart, {
      props: { pipelines: runs }
    });
  const chartData = (wrapper.vm as any)['chartData'];
    expect(chartData.labels.length).toBe(10);
  });
});
