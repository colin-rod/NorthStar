/**
 * useMediaQuery Hook
 *
 * A Svelte 5 hook for responsive media queries.
 * SSR-safe: defaults to false (mobile-first) and updates after mount.
 *
 * Usage:
 * ```typescript
 * const isDesktop = useMediaQuery('(min-width: 768px)');
 * $: console.log(isDesktop()); // true or false
 * ```
 */

import { onMount } from 'svelte';

export function useMediaQuery(query: string) {
  // Default to false (mobile-first) for SSR safety
  // eslint-disable-next-line no-undef
  let matches = $state(false);

  onMount(() => {
    // Only run in browser
    const mediaQuery = window.matchMedia(query);

    // Set initial value
    matches = mediaQuery.matches;

    // Update on changes
    const handler = (e: MediaQueryListEvent) => {
      matches = e.matches;
    };

    mediaQuery.addEventListener('change', handler);

    // Cleanup on unmount
    return () => mediaQuery.removeEventListener('change', handler);
  });

  // Return a function to access the current value
  return () => matches;
}
