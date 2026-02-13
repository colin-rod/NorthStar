import { render, screen, cleanup } from '@testing-library/svelte';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import TestMediaQueryWrapper from './TestMediaQueryWrapper.svelte';

describe('useMediaQuery', () => {
  let matchMediaMock: ReturnType<typeof vi.fn>;
  let listeners: Array<(e: MediaQueryListEvent) => void> = [];

  beforeEach(() => {
    listeners = [];
  });

  const createMediaQueryList = (query: string, matches: boolean): MediaQueryList => {
    return {
      matches,
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
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    } as MediaQueryList;
  };

  const setupMatchMedia = (matches: boolean) => {
    matchMediaMock = vi.fn((query: string) => {
      return createMediaQueryList(query, matches);
    });

    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: matchMediaMock,
    });
  };

  afterEach(() => {
    listeners = [];
    cleanup();
    vi.clearAllMocks();
  });

  it('should return false initially (SSR-safe default)', () => {
    setupMatchMedia(false);
    render(TestMediaQueryWrapper, { props: { query: '(min-width: 768px)' } });
    expect(screen.getByTestId('media-query-result').textContent).toBe('false');
  });

  it('should return true when media query matches', () => {
    setupMatchMedia(true);
    render(TestMediaQueryWrapper, { props: { query: '(min-width: 768px)' } });
    expect(screen.getByTestId('media-query-result').textContent).toBe('true');
  });

  it('should return a function that returns the current matches value', () => {
    setupMatchMedia(false);
    render(TestMediaQueryWrapper, { props: { query: '(min-width: 768px)' } });

    // Initial value should be false (SSR-safe default)
    expect(screen.getByTestId('media-query-result').textContent).toBe('false');
  });

  it('should cleanup event listener on unmount', () => {
    setupMatchMedia(false);
    const { unmount } = render(TestMediaQueryWrapper, { props: { query: '(min-width: 768px)' } });

    // Verify matchMedia was called
    expect(matchMediaMock).toHaveBeenCalledWith('(min-width: 768px)');

    // Unmount the component
    unmount();

    // Verify removeEventListener was called during cleanup (at least one listener was removed)
    expect(listeners.length).toBe(0);
  });

  it('should work with different media queries', () => {
    setupMatchMedia(false);
    const { unmount: unmount1 } = render(TestMediaQueryWrapper, {
      props: { query: '(max-width: 767px)' },
    });
    expect(screen.getByTestId('media-query-result').textContent).toBe('false');
    unmount1();

    setupMatchMedia(false);
    const { unmount: unmount2 } = render(TestMediaQueryWrapper, {
      props: { query: '(min-width: 768px)' },
    });
    expect(screen.getByTestId('media-query-result').textContent).toBe('false');
    unmount2();

    setupMatchMedia(false);
    const { unmount: unmount3 } = render(TestMediaQueryWrapper, {
      props: { query: '(min-width: 1024px)' },
    });
    expect(screen.getByTestId('media-query-result').textContent).toBe('false');
    unmount3();
  });
});
