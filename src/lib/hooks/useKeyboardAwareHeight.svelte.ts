/**
 * useKeyboardAwareHeight Hook
 *
 * Dynamically adjusts element height based on Visual Viewport API
 * to prevent layout jank when mobile keyboard opens/closes.
 *
 * Uses visualViewport.height instead of window.innerHeight to get
 * the actual visible area excluding keyboard.
 *
 * @param element - Target element to adjust height
 * @param heightPercentage - Percentage of viewport to use (default: from SHEET_HEIGHT_PERCENTAGE)
 */

import { onMount, onDestroy } from 'svelte';

import { SHEET_HEIGHT_PERCENTAGE } from '$lib/constants/mobile-ux';

export function useKeyboardAwareHeight(
  element: HTMLElement | null,
  heightPercentage: number = SHEET_HEIGHT_PERCENTAGE,
) {
  let resizeHandler: ((e: Event) => void) | null = null;

  onMount(() => {
    if (!element) return;

    const updateHeight = () => {
      // Use Visual Viewport API if available (better for keyboard detection)
      const viewportHeight = window.visualViewport?.height ?? window.innerHeight;
      const maxHeight = Math.floor(viewportHeight * heightPercentage);

      element!.style.maxHeight = `${maxHeight}px`;

      // Scroll focused input into view if keyboard is open
      const focusedElement = document.activeElement;
      if (focusedElement && focusedElement.tagName === 'INPUT') {
        setTimeout(() => {
          (focusedElement as HTMLElement).scrollIntoView({
            behavior: 'smooth',
            block: 'nearest',
          });
        }, 100); // Small delay to let layout settle
      }
    };

    // Set initial height
    updateHeight();

    // Listen for viewport resize (keyboard open/close)
    resizeHandler = updateHeight;

    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', resizeHandler);
    } else {
      // Fallback for older browsers
      window.addEventListener('resize', resizeHandler);
    }

    // Cleanup function
    return () => {
      if (resizeHandler) {
        if (window.visualViewport) {
          window.visualViewport.removeEventListener('resize', resizeHandler);
        } else {
          window.removeEventListener('resize', resizeHandler);
        }
      }
    };
  });

  onDestroy(() => {
    // Additional cleanup in case onMount cleanup wasn't called
    if (resizeHandler) {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', resizeHandler);
      } else {
        window.removeEventListener('resize', resizeHandler);
      }
    }
  });
}
