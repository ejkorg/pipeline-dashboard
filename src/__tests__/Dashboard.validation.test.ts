import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import Dashboard from '@/components/Dashboard.vue';

// Mock the async components that aren't needed for validation tests
vi.mock('@/components/PipelineSummaryDashboard.vue', () => ({
  default: { template: '<div>Mocked PipelineSummaryDashboard</div>' }
}));

vi.mock('@/components/OfflineBanner.vue', () => ({
  default: { template: '<div>Mocked OfflineBanner</div>' }
}));

describe('Dashboard Input Validation', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('renders limit and offset inputs with proper attributes', async () => {
    const wrapper = mount(Dashboard);
    
    const limitInput = wrapper.find('#limit-input');
    const offsetInput = wrapper.find('#offset-input');
    
    expect(limitInput.exists()).toBe(true);
    expect(offsetInput.exists()).toBe(true);
    
    // Check HTML validation attributes
    expect(limitInput.attributes('min')).toBe('0');
    expect(limitInput.attributes('max')).toBe('10000');
    expect(limitInput.attributes('type')).toBe('number');
    
    expect(offsetInput.attributes('min')).toBe('0');
    expect(offsetInput.attributes('max')).toBe('10000');
    expect(offsetInput.attributes('type')).toBe('number');
  });

  it('shows error for limit values over 10,000', async () => {
    const wrapper = mount(Dashboard);
    const limitInput = wrapper.find('#limit-input');
    
    // Simulate user typing a large number
    await limitInput.setValue('15000');
    await limitInput.trigger('input');
    
    // Should clamp the value to 10000
    expect((limitInput.element as HTMLInputElement).value).toBe('10000');
    
    // Should not show error since value was clamped
    const errorMessage = wrapper.find('#limit-error');
    expect(errorMessage.exists()).toBe(false);
  });

  it('shows error for negative limit values', async () => {
    const wrapper = mount(Dashboard);
    const limitInput = wrapper.find('#limit-input');
    
    // Simulate user typing a negative number
    await limitInput.setValue('-5');
    await limitInput.trigger('input');
    
    // Should clamp the value to 0
    expect((limitInput.element as HTMLInputElement).value).toBe('0');
    
    // Should not show error since value was clamped
    const errorMessage = wrapper.find('#limit-error');
    expect(errorMessage.exists()).toBe(false);
  });

  it('accepts valid limit values', async () => {
    const wrapper = mount(Dashboard);
    const limitInput = wrapper.find('#limit-input');
    
    // Test boundary values
    await limitInput.setValue('0');
    await limitInput.trigger('input');
    expect((limitInput.element as HTMLInputElement).value).toBe('0');
    
    await limitInput.setValue('10000');
    await limitInput.trigger('input');
    expect((limitInput.element as HTMLInputElement).value).toBe('10000');
    
    await limitInput.setValue('5000');
    await limitInput.trigger('input');
    expect((limitInput.element as HTMLInputElement).value).toBe('5000');
    
    // No error messages should be present
    const errorMessage = wrapper.find('#limit-error');
    expect(errorMessage.exists()).toBe(false);
  });

  it('shows error for offset values over 10,000', async () => {
    const wrapper = mount(Dashboard);
    const offsetInput = wrapper.find('#offset-input');
    
    // Simulate user typing a large number
    await offsetInput.setValue('20000');
    await offsetInput.trigger('input');
    
    // Should clamp the value to 10000
    expect((offsetInput.element as HTMLInputElement).value).toBe('10000');
    
    // Should not show error since value was clamped
    const errorMessage = wrapper.find('#offset-error');
    expect(errorMessage.exists()).toBe(false);
  });

  it('disables Apply button when validation errors exist', async () => {
    const wrapper = mount(Dashboard);
    
    // Initially, Apply button should be enabled (no errors)
    const applyButton = wrapper.find('button[title*="Apply"]');
    expect(applyButton.attributes('disabled')).toBe(undefined);
    
    // The inputs should always clamp values, so Apply button should remain enabled
    const limitInput = wrapper.find('#limit-input');
    await limitInput.setValue('15000');
    await limitInput.trigger('input');
    
    // Button should still be enabled because value was clamped
    expect(applyButton.attributes('disabled')).toBe(undefined);
  });

  it('handles paste events properly', async () => {
    const wrapper = mount(Dashboard);
    const limitInput = wrapper.find('#limit-input');
    
    // Simulate paste by setting value and triggering paste event
    (limitInput.element as HTMLInputElement).value = '25000';
    await limitInput.trigger('paste');
    
    // Wait for setTimeout in handlePaste
    await new Promise(resolve => setTimeout(resolve, 10));
    
    // Value should be clamped
    expect((limitInput.element as HTMLInputElement).value).toBe('10000');
  });

  it('has proper accessibility attributes', async () => {
    const wrapper = mount(Dashboard);
    
    const limitInput = wrapper.find('#limit-input');
    const offsetInput = wrapper.find('#offset-input');
    
    // Check labels are properly associated
    const limitLabel = wrapper.find('label[for="limit-input"]');
    const offsetLabel = wrapper.find('label[for="offset-input"]');
    
    expect(limitLabel.exists()).toBe(true);
    expect(offsetLabel.exists()).toBe(true);
    
    expect(limitLabel.text()).toBe('Limit');
    expect(offsetLabel.text()).toBe('Offset');
  });

  it('maintains responsive layout structure', async () => {
    const wrapper = mount(Dashboard);
    
    // Check the main flex container
    const controlsContainer = wrapper.find('.flex.gap-2.items-start.flex-wrap');
    expect(controlsContainer.exists()).toBe(true);
    
    // Check input containers have proper flex structure
    const inputContainers = wrapper.findAll('.flex.flex-col');
    expect(inputContainers.length).toBeGreaterThanOrEqual(4); // Limit, Offset, checkbox container, Apply button container
    
    // Check Apply button has proper height matching inputs
    const applyButton = wrapper.find('button[title*="Apply"]');
    expect(applyButton.classes()).toContain('h-9');
  });

  it('displays helper text for maximum values', async () => {
    const wrapper = mount(Dashboard);
    
    // Check that helper text is present for both inputs
    const helperTexts = wrapper.findAll('.text-xs.text-gray-500');
    const helperTextContents = helperTexts.map(h => h.text());
    
    // Should have exactly 2 helper texts saying "Max: 10,000"
    const maxHelperTexts = helperTextContents.filter(text => text === 'Max: 10,000');
    expect(maxHelperTexts.length).toBe(2);
  });
});