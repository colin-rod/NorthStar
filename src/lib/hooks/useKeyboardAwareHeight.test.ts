import { render, cleanup } from '@testing-library/svelte';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import TestKeyboardAwareWrapper from './TestKeyboardAwareWrapper.svelte';

describe('useKeyboardAwareHeight', () => {
  let visualViewportMock: Partial<VisualViewport>;
  let resizeListeners: Array<(e: Event) => void> = [];

  beforeEach(() => {
    resizeListeners = [];

    visualViewportMock = {
      height: 800,
      addEventListener: vi.fn((_, handler) => {
        resizeListeners.push(handler as (e: Event) => void);
      }),
      removeEventListener: vi.fn((_, handler) => {
        const index = resizeListeners.indexOf(handler as (e: Event) => void);
        if (index > -1) resizeListeners.splice(index, 1);
      }),
    };

    Object.defineProperty(window, 'visualViewport', {
      writable: true,
      configurable: true,
      value: visualViewportMock,
    });
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('should set initial height based on visualViewport.height', () => {
    const { container } = render(TestKeyboardAwareWrapper);
    const target = container.querySelector('[data-testid="height-target"]') as HTMLElement;

    // Should set max-height to 85% of 800px = 680px
    expect(target.style.maxHeight).toBe('680px');
  });

  it('should update height when keyboard opens (viewport shrinks)', () => {
    const { container } = render(TestKeyboardAwareWrapper);
    const target = container.querySelector('[data-testid="height-target"]') as HTMLElement;

    // Initial height
    expect(target.style.maxHeight).toBe('680px'); // 85% of 800px

    // Simulate keyboard open: viewport shrinks to 400px
    visualViewportMock.height = 400;
    resizeListeners.forEach((listener) => listener(new Event('resize')));

    // Height should update to 85% of 400px = 340px
    expect(target.style.maxHeight).toBe('340px');
  });

  it('should restore height when keyboard closes (viewport grows)', () => {
    const { container } = render(TestKeyboardAwareWrapper);
    const target = container.querySelector('[data-testid="height-target"]') as HTMLElement;

    // Simulate keyboard open
    visualViewportMock.height = 400;
    resizeListeners.forEach((listener) => listener(new Event('resize')));
    expect(target.style.maxHeight).toBe('340px');

    // Keyboard closes
    visualViewportMock.height = 800;
    resizeListeners.forEach((listener) => listener(new Event('resize')));
    expect(target.style.maxHeight).toBe('680px');
  });

  it('should scroll focused input into view when keyboard opens', () => {
    const { container } = render(TestKeyboardAwareWrapper);
    const target = container.querySelector('[data-testid="height-target"]') as HTMLElement;
    const input = document.createElement('input');
    target.appendChild(input);

    const scrollIntoViewMock = vi.fn();
    input.scrollIntoView = scrollIntoViewMock;
    input.focus();

    // Use fake timers to control the setTimeout
    vi.useFakeTimers();

    // Simulate keyboard open
    visualViewportMock.height = 400;
    resizeListeners.forEach((listener) => listener(new Event('resize')));

    // Advance timers to trigger the delayed scrollIntoView
    vi.advanceTimersByTime(100);

    expect(scrollIntoViewMock).toHaveBeenCalledWith({
      behavior: 'smooth',
      block: 'nearest',
    });

    vi.useRealTimers();
  });

  it('should remove event listener on unmount', () => {
    const { unmount } = render(TestKeyboardAwareWrapper);
    expect(resizeListeners.length).toBe(1);

    unmount();
    expect(resizeListeners.length).toBe(0);
  });

  it('should fallback to window.innerHeight if visualViewport not supported', () => {
    Object.defineProperty(window, 'visualViewport', {
      writable: true,
      configurable: true,
      value: null,
    });

    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: 900,
    });

    const { container } = render(TestKeyboardAwareWrapper);
    const target = container.querySelector('[data-testid="height-target"]') as HTMLElement;

    // Fallback: 85% of 900px = 765px
    expect(target.style.maxHeight).toBe('765px');
  });
});
