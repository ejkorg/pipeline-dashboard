import { describe, it, expect, beforeEach } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { usePrefsStore } from '@/stores/prefs';

describe('Prefs Store Input Validation', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    // Clear localStorage before each test
    localStorage.clear();
  });

  describe('setApiLimit', () => {
    it('clamps values to maximum of 10,000', () => {
      const prefs = usePrefsStore();
      
      prefs.setApiLimit(15000);
      expect(prefs.apiLimit).toBe(10000);
      
      prefs.setApiLimit(50000);
      expect(prefs.apiLimit).toBe(10000);
    });

    it('clamps values to minimum of 0', () => {
      const prefs = usePrefsStore();
      
      prefs.setApiLimit(-5);
      expect(prefs.apiLimit).toBe(0);
      
      prefs.setApiLimit(-1000);
      expect(prefs.apiLimit).toBe(0);
    });

    it('accepts valid values within range', () => {
      const prefs = usePrefsStore();
      
      prefs.setApiLimit(0);
      expect(prefs.apiLimit).toBe(0);
      
      prefs.setApiLimit(5000);
      expect(prefs.apiLimit).toBe(5000);
      
      prefs.setApiLimit(10000);
      expect(prefs.apiLimit).toBe(10000);
    });

    it('floors decimal values', () => {
      const prefs = usePrefsStore();
      
      prefs.setApiLimit(5000.7);
      expect(prefs.apiLimit).toBe(5000);
      
      prefs.setApiLimit(999.9);
      expect(prefs.apiLimit).toBe(999);
    });

    it('handles null and undefined values', () => {
      const prefs = usePrefsStore();
      
      prefs.setApiLimit(null as any);
      expect(prefs.apiLimit).toBe(0);
      
      prefs.setApiLimit(undefined as any);
      expect(prefs.apiLimit).toBe(0);
    });

    it('handles string values by converting them', () => {
      const prefs = usePrefsStore();
      
      prefs.setApiLimit('5000' as any);
      expect(prefs.apiLimit).toBe(5000);
      
      prefs.setApiLimit('15000' as any);
      expect(prefs.apiLimit).toBe(10000);
      
      prefs.setApiLimit('invalid' as any);
      expect(prefs.apiLimit).toBe(0);
    });
  });

  describe('setApiOffset', () => {
    it('clamps values to maximum of 10,000', () => {
      const prefs = usePrefsStore();
      
      prefs.setApiOffset(15000);
      expect(prefs.apiOffset).toBe(10000);
      
      prefs.setApiOffset(25000);
      expect(prefs.apiOffset).toBe(10000);
    });

    it('clamps values to minimum of 0', () => {
      const prefs = usePrefsStore();
      
      prefs.setApiOffset(-5);
      expect(prefs.apiOffset).toBe(0);
      
      prefs.setApiOffset(-1000);
      expect(prefs.apiOffset).toBe(0);
    });

    it('accepts valid values within range', () => {
      const prefs = usePrefsStore();
      
      prefs.setApiOffset(0);
      expect(prefs.apiOffset).toBe(0);
      
      prefs.setApiOffset(2500);
      expect(prefs.apiOffset).toBe(2500);
      
      prefs.setApiOffset(10000);
      expect(prefs.apiOffset).toBe(10000);
    });

    it('floors decimal values', () => {
      const prefs = usePrefsStore();
      
      prefs.setApiOffset(1000.3);
      expect(prefs.apiOffset).toBe(1000);
      
      prefs.setApiOffset(999.9);
      expect(prefs.apiOffset).toBe(999);
    });

    it('handles null and undefined values', () => {
      const prefs = usePrefsStore();
      
      prefs.setApiOffset(null as any);
      expect(prefs.apiOffset).toBe(0);
      
      prefs.setApiOffset(undefined as any);
      expect(prefs.apiOffset).toBe(0);
    });
  });

  describe('persistence', () => {
    it('clamps values set through setters', () => {
      const prefs = usePrefsStore();
      
      prefs.setApiLimit(15000);
      prefs.setApiOffset(20000);
      
      // Values should be clamped immediately
      expect(prefs.apiLimit).toBe(10000);
      expect(prefs.apiOffset).toBe(10000);
    });

    it('loads values from localStorage on initialization', () => {
      // Set values in localStorage that exceed limits
      localStorage.setItem('api:limit', '25000');
      localStorage.setItem('api:offset', '30000');
      
      // Create new store instance
      setActivePinia(createPinia());
      const prefs = usePrefsStore();
      
      // Initial values should be loaded from localStorage (even if they exceed limits)
      // but when we set them again, they should be clamped
      expect(prefs.apiLimit).toBe(25000); // Initial load doesn't clamp
      expect(prefs.apiOffset).toBe(30000); // Initial load doesn't clamp
      
      // But setting them through the setters should clamp
      prefs.setApiLimit(prefs.apiLimit);
      prefs.setApiOffset(prefs.apiOffset);
      
      expect(prefs.apiLimit).toBe(10000);
      expect(prefs.apiOffset).toBe(10000);
    });
  });
});