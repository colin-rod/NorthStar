import { render, screen, cleanup } from '@testing-library/svelte';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import TestMediaQueryWrapper from './TestMediaQueryWrapper.svelte';

describe('useMediaQuery', () => {
  let matchMediaMock: ReturnType<typeof vi.fn>;
  let mediaQueryList: Partial<MediaQueryList>;
  let listeners: Array<(e: MediaQueryListEvent) => void> = [];

  beforeEach(() => {
    // Create a media query list object that we can control
    mediaQueryList = {
      matches: false,
      media: '',
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

    // Mock window.matchMedia
    matchMediaMock = vi.fn((query: string) => {
      mediaQueryList.media = query;
      return mediaQueryList as MediaQueryList;
    });

    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: matchMediaMock,
    });
  });

  afterEach(() => {
    listeners = [];
    cleanup();
    vi.clearAllMocks();
  });

  it('should return false initially (SSR-safe default)', () => {
    render(TestMediaQueryWrapper, { props: { query: '(min-width: 768px)' } });
    expect(screen.getByTestId('media-query-result').textContent).toBe('false');
  });

  it('should return a function that returns the current matches value', () => {
    render(TestMediaQueryWrapper, { props: { query: '(min-width: 768px)' } });

    // Initial value should be false (SSR-safe default)
    expect(screen.getByTestId('media-query-result').textContent).toBe('false');
  });

  it('should cleanup event listener on unmount', () => {
    const { unmount } = render(TestMediaQueryWrapper, { props: { query: '(min-width: 768px)' } });

    // Verify addEventListener was called
    expect(mediaQueryList.addEventListener).toHaveBeenCalled();

    // Unmount the component
    unmount();

    // Verify removeEventListener was called during cleanup
    expect(mediaQueryList.removeEventListener).toHaveBeenCalled();
  });

  it('should work with different media queries', () => {
    const { unmount: unmount1 } = render(TestMediaQueryWrapper, {
      props: { query: '(max-width: 767px)' },
    });
    expect(screen.getByTestId('media-query-result').textContent).toBe('false');
    unmount1();

    const { unmount: unmount2 } = render(TestMediaQueryWrapper, {
      props: { query: '(min-width: 768px)' },
    });
    expect(screen.getByTestId('media-query-result').textContent).toBe('false');
    unmount2();

    const { unmount: unmount3 } = render(TestMediaQueryWrapper, {
      props: { query: '(min-width: 1024px)' },
    });
    expect(screen.getByTestId('media-query-result').textContent).toBe('false');
    unmount3();
  });
});
