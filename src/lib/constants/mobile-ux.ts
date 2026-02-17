/**
 * Mobile UX Constants
 *
 * Centralized constants for mobile user experience optimizations.
 */

/**
 * Minimum tap target height in pixels (iOS/Android Human Interface Guidelines)
 */
export const MOBILE_TAP_TARGET_HEIGHT = 44;

/**
 * Minimum swipe distance in pixels to trigger dismiss gesture
 */
export const SWIPE_DISMISS_THRESHOLD = 50;

/**
 * Minimum velocity in px/ms for fast flick dismiss
 */
export const SWIPE_VELOCITY_THRESHOLD = 0.3;

/**
 * Percentage of viewport height to use for bottom sheet (0.85 = 85%)
 */
export const SHEET_HEIGHT_PERCENTAGE = 0.85;

/**
 * Minimum font size in pixels to prevent iOS auto-zoom on input focus
 */
export const MIN_FONT_SIZE_NO_ZOOM = 16;
