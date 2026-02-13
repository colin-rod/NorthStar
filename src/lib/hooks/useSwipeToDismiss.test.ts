import { render, cleanup } from '@testing-library/svelte';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import TestSwipeToDismissWrapper from './TestSwipeToDismissWrapper.svelte';

describe('useSwipeToDismiss', () => {
  beforeEach(() => {
    // Mock requestAnimationFrame
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
      cb(0);
      return 0;
    });

    // Mock matchMedia (default: no reduced motion)
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((_query) => ({
        matches: false, // Default: no reduced motion
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    });
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  describe('Gesture Detection', () => {
    it('should detect vertical swipe-down gesture', () => {
      vi.useFakeTimers();
      const onDismiss = vi.fn();
      const { container } = render(TestSwipeToDismissWrapper, {
        props: { onDismiss },
      });

      const target = container.querySelector('[data-testid="swipe-target"]')!;

      // Simulate touch events: touchstart → touchmove (60px down) → touchend
      target.dispatchEvent(
        new TouchEvent('touchstart', {
          touches: [{ clientX: 100, clientY: 100 } as Touch],
        }),
      );

      target.dispatchEvent(
        new TouchEvent('touchmove', {
          touches: [{ clientX: 100, clientY: 160 } as Touch],
        }),
      );

      target.dispatchEvent(
        new TouchEvent('touchend', {
          changedTouches: [{ clientX: 100, clientY: 160 } as Touch],
        }),
      );

      // Should dismiss after animation delay (200ms)
      vi.advanceTimersByTime(200);
      expect(onDismiss).toHaveBeenCalled();
      vi.useRealTimers();
    });

    it('should NOT dismiss on swipe-up', () => {
      const onDismiss = vi.fn();
      const { container } = render(TestSwipeToDismissWrapper, {
        props: { onDismiss },
      });

      const target = container.querySelector('[data-testid="swipe-target"]')!;

      // Swipe UP (negative deltaY)
      target.dispatchEvent(
        new TouchEvent('touchstart', {
          touches: [{ clientX: 100, clientY: 100 } as Touch],
        }),
      );

      target.dispatchEvent(
        new TouchEvent('touchmove', {
          touches: [{ clientX: 100, clientY: 40 } as Touch],
        }),
      );

      target.dispatchEvent(
        new TouchEvent('touchend', {
          changedTouches: [{ clientX: 100, clientY: 40 } as Touch],
        }),
      );

      expect(onDismiss).not.toHaveBeenCalled();
    });

    it('should NOT dismiss on horizontal swipe', () => {
      const onDismiss = vi.fn();
      const { container } = render(TestSwipeToDismissWrapper, {
        props: { onDismiss },
      });

      const target = container.querySelector('[data-testid="swipe-target"]')!;

      // Horizontal swipe (deltaX > deltaY)
      target.dispatchEvent(
        new TouchEvent('touchstart', {
          touches: [{ clientX: 100, clientY: 100 } as Touch],
        }),
      );

      target.dispatchEvent(
        new TouchEvent('touchmove', {
          touches: [{ clientX: 200, clientY: 110 } as Touch],
        }),
      );

      target.dispatchEvent(
        new TouchEvent('touchend', {
          changedTouches: [{ clientX: 200, clientY: 110 } as Touch],
        }),
      );

      expect(onDismiss).not.toHaveBeenCalled();
    });

    it('should dismiss on fast flick (high velocity)', () => {
      vi.useFakeTimers();
      const onDismiss = vi.fn();

      // Use setSystemTime to control Date.now()
      vi.setSystemTime(0);

      const { container } = render(TestSwipeToDismissWrapper, {
        props: { onDismiss },
      });

      const target = container.querySelector('[data-testid="swipe-target"]')!;

      // Fast flick: 30px in 50ms = 0.6px/ms velocity (> 0.3 threshold)
      target.dispatchEvent(
        new TouchEvent('touchstart', {
          touches: [{ clientX: 100, clientY: 100 } as Touch],
        }),
      );

      // Advance time to 50ms
      vi.setSystemTime(50);

      target.dispatchEvent(
        new TouchEvent('touchmove', {
          touches: [{ clientX: 100, clientY: 130 } as Touch],
        }),
      );

      target.dispatchEvent(
        new TouchEvent('touchend', {
          changedTouches: [{ clientX: 100, clientY: 130 } as Touch],
        }),
      );

      // Should dismiss after animation delay
      vi.advanceTimersByTime(200);
      expect(onDismiss).toHaveBeenCalled();

      vi.useRealTimers();
    });

    it('should NOT dismiss if distance < threshold and velocity low', () => {
      const onDismiss = vi.fn();
      const { container } = render(TestSwipeToDismissWrapper, {
        props: { onDismiss },
      });

      const target = container.querySelector('[data-testid="swipe-target"]')!;

      // Small swipe: 20px (below 50px threshold)
      target.dispatchEvent(
        new TouchEvent('touchstart', {
          touches: [{ clientX: 100, clientY: 100 } as Touch],
        }),
      );

      target.dispatchEvent(
        new TouchEvent('touchmove', {
          touches: [{ clientX: 100, clientY: 120 } as Touch],
        }),
      );

      target.dispatchEvent(
        new TouchEvent('touchend', {
          changedTouches: [{ clientX: 100, clientY: 120 } as Touch],
        }),
      );

      expect(onDismiss).not.toHaveBeenCalled();
    });
  });

  describe('Visual Feedback', () => {
    it('should apply transform during drag', () => {
      const { container } = render(TestSwipeToDismissWrapper);
      const target = container.querySelector('[data-testid="swipe-target"]') as HTMLElement;

      target.dispatchEvent(
        new TouchEvent('touchstart', {
          touches: [{ clientX: 100, clientY: 100 } as Touch],
        }),
      );

      target.dispatchEvent(
        new TouchEvent('touchmove', {
          touches: [{ clientX: 100, clientY: 150 } as Touch],
        }),
      );

      // Expect translateY(50px)
      expect(target.style.transform).toContain('translateY(50px)');
    });

    it('should reset transform on touchend if not dismissed', () => {
      vi.useFakeTimers();
      vi.setSystemTime(0);

      const { container } = render(TestSwipeToDismissWrapper);
      const target = container.querySelector('[data-testid="swipe-target"]') as HTMLElement;

      // Small swipe that won't dismiss (20px - below 50px threshold)
      // Slow swipe: 20px in 500ms = 0.04 px/ms (well below 0.3 threshold)
      target.dispatchEvent(
        new TouchEvent('touchstart', {
          touches: [{ clientX: 100, clientY: 100 } as Touch],
        }),
      );

      // Advance time to ensure low velocity
      vi.setSystemTime(500);

      target.dispatchEvent(
        new TouchEvent('touchmove', {
          touches: [{ clientX: 100, clientY: 120 } as Touch],
        }),
      );

      target.dispatchEvent(
        new TouchEvent('touchend', {
          changedTouches: [{ clientX: 100, clientY: 120 } as Touch],
        }),
      );

      // The transform is set immediately, no setTimeout involved for snap-back
      // Just check that it's set to snap back (not dismissed to 100%)
      expect(target.style.transform).toBe('translateY(0px)');
      vi.useRealTimers();
    });
  });

  describe('Accessibility', () => {
    it('should disable animations if prefers-reduced-motion', () => {
      // Mock matchMedia for reduced motion
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation((query) => ({
          matches: query === '(prefers-reduced-motion: reduce)',
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
        })),
      });

      const { container } = render(TestSwipeToDismissWrapper);
      const target = container.querySelector('[data-testid="swipe-target"]') as HTMLElement;

      // Verify transition property is set to 'none'
      expect(target.style.transition).toBe('none');
    });
  });

  describe('Cleanup', () => {
    it('should remove event listeners on unmount', () => {
      const removeEventListenerSpy = vi.spyOn(HTMLElement.prototype, 'removeEventListener');

      const { unmount } = render(TestSwipeToDismissWrapper);
      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith('touchstart', expect.any(Function));
      expect(removeEventListenerSpy).toHaveBeenCalledWith('touchmove', expect.any(Function));
      expect(removeEventListenerSpy).toHaveBeenCalledWith('touchend', expect.any(Function));
    });
  });
});
