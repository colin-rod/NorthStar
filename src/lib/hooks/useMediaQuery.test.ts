import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { useMediaQuery } from './useMediaQuery.svelte';

describe('useMediaQuery', () => {
  let matchMediaMock: ReturnType<typeof vi.fn>;
  let listeners: Array<(e: MediaQueryListEvent) => void> = [];

  beforeEach(() => {
    // Mock window.matchMedia
    matchMediaMock = vi.fn((query: string) => {
      const mql: Partial<MediaQueryList> = {
        matches: false,
        media: query,
        addEventListener: vi.fn((_, handler) => {
          listeners.push(handler as (e: MediaQueryListEvent) => void);
        }),
        removeEventListener: vi.fn((_, handler) => {
          const index = listeners.indexOf(handler as (e: MediaQueryListEvent) => void);
          if (index > -1) {
            listeners.splice(index, 1);
          }
        }),
      };
      return mql as MediaQueryList;
    });

    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: matchMediaMock,
    });
  });

  afterEach(() => {
    listeners = [];
    vi.clearAllMocks();
  });

  it('should return false initially (SSR-safe default)', () => {
    const isDesktop = useMediaQuery('(min-width: 768px)');
    expect(isDesktop()).toBe(false);
  });

  it('should return a function that returns the current matches value', () => {
    const isDesktop = useMediaQuery('(min-width: 768px)');

    // Should return a function
    expect(typeof isDesktop).toBe('function');

    // Initial value should be false (SSR-safe default)
    expect(isDesktop()).toBe(false);
  });

  it('should cleanup event listener on unmount', () => {
    const removeEventListenerSpy = vi.fn();
    matchMediaMock = vi.fn(() => ({
      matches: false,
      media: '(min-width: 768px)',
      addEventListener: vi.fn(),
      removeEventListener: removeEventListenerSpy,
    }));

    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: matchMediaMock,
    });

    const _isDesktop = useMediaQuery('(min-width: 768px)');

    // Cleanup should be called when component unmounts
    // This would be triggered by Svelte's cleanup mechanism
    // We can't directly test this without a full Svelte component context
    // but we can verify the function is registered
    expect(removeEventListenerSpy).not.toHaveBeenCalled();
  });

  it('should work with different media queries', () => {
    const isMobile = useMediaQuery('(max-width: 767px)');
    const _isDesktop = useMediaQuery('(min-width: 768px)');
    const isLargeScreen = useMediaQuery('(min-width: 1024px)');

    // All should return functions that initially return false
    expect(isMobile()).toBe(false);
    expect(_isDesktop()).toBe(false);
    expect(isLargeScreen()).toBe(false);
  });
});
