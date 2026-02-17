import { describe, it, expect } from 'vitest';

import {
  getMobileInputClasses,
  shouldUseNativePicker,
  getNumericInputMode,
} from './mobile-input-helpers';

describe('mobile-input-helpers', () => {
  describe('getMobileInputClasses', () => {
    it('should return min-h-11 (44px) for mobile tap targets', () => {
      const classes = getMobileInputClasses('select');
      expect(classes).toContain('min-h-11'); // 44px
    });

    it('should use text-base (16px) to prevent iOS auto-zoom', () => {
      const classes = getMobileInputClasses('input');
      expect(classes).toContain('text-base');
    });

    it('should maintain existing desktop styles with md:text-sm', () => {
      const classes = getMobileInputClasses('select');
      expect(classes).toContain('md:text-sm'); // Desktop uses smaller text
    });

    it('should include padding for select elements', () => {
      const classes = getMobileInputClasses('select');
      expect(classes).toContain('px-3');
      expect(classes).toContain('py-2');
    });

    it('should include padding for button elements', () => {
      const classes = getMobileInputClasses('button');
      expect(classes).toContain('px-4');
    });

    it('should return base classes for input type', () => {
      const classes = getMobileInputClasses('input');
      expect(classes).toContain('min-h-11');
      expect(classes).toContain('text-base');
      expect(classes).toContain('md:text-sm');
    });
  });

  describe('shouldUseNativePicker', () => {
    it('should return true on mobile devices (iPhone)', () => {
      // Mock userAgent for iPhone
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
        configurable: true,
      });

      expect(shouldUseNativePicker()).toBe(true);
    });

    it('should return true on mobile devices (Android)', () => {
      // Mock userAgent for Android
      Object.defineProperty(navigator, 'userAgent', {
        value:
          'Mozilla/5.0 (Linux; Android 10; SM-G973F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.101 Mobile Safari/537.36',
        configurable: true,
      });

      expect(shouldUseNativePicker()).toBe(true);
    });

    it('should return true on iPad', () => {
      // Mock userAgent for iPad
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (iPad; CPU OS 13_0 like Mac OS X)',
        configurable: true,
      });

      expect(shouldUseNativePicker()).toBe(true);
    });

    it('should return false when navigator is undefined (SSR)', () => {
      const originalNavigator = globalThis.navigator;
      // @ts-expect-error - simulating SSR environment
      delete globalThis.navigator;

      expect(shouldUseNativePicker()).toBe(false);

      // Restore navigator
      globalThis.navigator = originalNavigator;
    });

    it('should return false on desktop', () => {
      // Mock userAgent for desktop macOS
      Object.defineProperty(navigator, 'userAgent', {
        value:
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        configurable: true,
      });

      expect(shouldUseNativePicker()).toBe(false);
    });
  });

  describe('getNumericInputMode', () => {
    it('should return "numeric" when allowDecimal is false', () => {
      expect(getNumericInputMode(false)).toBe('numeric');
    });

    it('should return "decimal" when allowDecimal is true', () => {
      expect(getNumericInputMode(true)).toBe('decimal');
    });

    it('should return "numeric" by default (no argument)', () => {
      expect(getNumericInputMode()).toBe('numeric');
    });
  });
});
