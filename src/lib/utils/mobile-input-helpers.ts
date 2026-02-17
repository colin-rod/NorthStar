/**
 * Mobile Input Helpers
 *
 * Utilities for optimizing form inputs on mobile devices.
 */

/**
 * Get Tailwind classes for mobile-optimized inputs
 * - Minimum 44px height for tap targets (iOS/Android HIG)
 * - 16px font size to prevent iOS auto-zoom
 * - Maintains desktop styles with responsive classes
 *
 * @param type - Type of input element (input, select, or button)
 * @returns Space-separated Tailwind classes
 */
export function getMobileInputClasses(type: 'input' | 'select' | 'button'): string {
  const baseClasses = 'min-h-11 text-base md:text-sm'; // min-h-11 = 44px

  if (type === 'select') {
    return `${baseClasses} px-3 py-2`;
  }

  if (type === 'button') {
    return `${baseClasses} px-4`;
  }

  return baseClasses; // input
}

/**
 * Detect if device is mobile (for native picker decisions)
 *
 * @returns true if running on a mobile device (iPhone, iPad, Android)
 */
export function shouldUseNativePicker(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
}

/**
 * Get appropriate inputmode for numeric fields
 *
 * @param allowDecimal - Whether to allow decimal numbers
 * @returns 'numeric' for integers, 'decimal' for decimals
 */
export function getNumericInputMode(allowDecimal: boolean = false): 'numeric' | 'decimal' {
  return allowDecimal ? 'decimal' : 'numeric';
}
