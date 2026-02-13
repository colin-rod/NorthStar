/**
 * useSwipeToDismiss Hook
 *
 * Implements vertical swipe-down gesture to dismiss bottom sheet.
 * Only works for vertical downward swipes. Provides visual feedback.
 *
 * @param element - Target element to attach gesture listeners
 * @param onDismiss - Callback when dismiss gesture is completed
 * @param threshold - Minimum swipe distance in pixels (default: from SWIPE_DISMISS_THRESHOLD)
 * @param velocityThreshold - Minimum velocity in px/ms for flick dismiss (default: from SWIPE_VELOCITY_THRESHOLD)
 */

import { onMount, onDestroy } from 'svelte';

import { SWIPE_DISMISS_THRESHOLD, SWIPE_VELOCITY_THRESHOLD } from '$lib/constants/mobile-ux';

interface SwipeState {
  startY: number;
  startX: number;
  currentY: number;
  currentX: number;
  startTime: number;
  isDragging: boolean;
}

export function useSwipeToDismiss(
  element: HTMLElement | null,
  onDismiss: () => void,
  threshold: number = SWIPE_DISMISS_THRESHOLD,
  velocityThreshold: number = SWIPE_VELOCITY_THRESHOLD,
) {
  // eslint-disable-next-line no-undef
  const state = $state<SwipeState>({
    startY: 0,
    startX: 0,
    currentY: 0,
    currentX: 0,
    startTime: 0,
    isDragging: false,
  });

  let animationFrameId: number | null = null;
  let prefersReducedMotion = false;

  onMount(() => {
    if (!element) return;

    // Check for reduced motion preference
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    prefersReducedMotion = mediaQuery.matches;

    // Apply transition (or none if reduced motion)
    element.style.transition = prefersReducedMotion ? 'none' : 'transform 200ms ease-out';

    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      state.startY = touch.clientY;
      state.startX = touch.clientX;
      state.currentY = touch.clientY;
      state.currentX = touch.clientX;
      state.startTime = Date.now();
      state.isDragging = true;

      // Disable transition during drag
      element!.style.transition = 'none';
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!state.isDragging) return;

      const touch = e.touches[0];
      state.currentY = touch.clientY;
      state.currentX = touch.clientX;

      const deltaY = state.currentY - state.startY;
      const deltaX = state.currentX - state.startX;

      // Only track vertical swipes downward
      if (deltaY > 0 && Math.abs(deltaY) > Math.abs(deltaX)) {
        // Use requestAnimationFrame for smooth updates
        if (animationFrameId) {
          cancelAnimationFrame(animationFrameId);
        }

        animationFrameId = requestAnimationFrame(() => {
          element!.style.transform = `translateY(${deltaY}px)`;
        });

        // Prevent scrolling when swiping
        e.preventDefault();
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!state.isDragging) return;

      const touch = e.changedTouches[0];
      state.currentY = touch.clientY;
      state.currentX = touch.clientX;

      const deltaY = state.currentY - state.startY;
      const deltaX = state.currentX - state.startX;
      const duration = Date.now() - state.startTime;
      const velocity = deltaY / duration; // px/ms

      // Determine if this is a dismiss gesture
      const isVerticalSwipe = Math.abs(deltaY) > Math.abs(deltaX);
      const isDownwardSwipe = deltaY > 0;
      const meetsDistanceThreshold = deltaY >= threshold;
      const meetsVelocityThreshold = velocity >= velocityThreshold;

      const shouldDismiss =
        isVerticalSwipe && isDownwardSwipe && (meetsDistanceThreshold || meetsVelocityThreshold);

      // Re-enable transition
      element!.style.transition = prefersReducedMotion ? 'none' : 'transform 200ms ease-out';

      if (shouldDismiss) {
        // Animate out and dismiss
        element!.style.transform = 'translateY(100%)';
        setTimeout(
          () => {
            onDismiss();
          },
          prefersReducedMotion ? 0 : 200,
        );
      } else {
        // Snap back
        element!.style.transform = 'translateY(0px)';
      }

      state.isDragging = false;
    };

    element.addEventListener('touchstart', handleTouchStart, { passive: false });
    element.addEventListener('touchmove', handleTouchMove, { passive: false });
    element.addEventListener('touchend', handleTouchEnd, { passive: false });

    // Cleanup function
    return () => {
      if (element) {
        element.removeEventListener('touchstart', handleTouchStart);
        element.removeEventListener('touchmove', handleTouchMove);
        element.removeEventListener('touchend', handleTouchEnd);
      }
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  });

  onDestroy(() => {
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
    }
  });
}
