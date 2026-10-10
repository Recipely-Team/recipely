/** How long a toast stays before auto-dismissing, unless overridden per toast. */
export const DEFAULT_TOAST_DURATION_MS = 4000;

/**
 * A toast with a button ("View", "Retry") stays at least this long: 4 s was too
 * short for a motor-impaired or screen-reader user to reach it (WCAG 2.2.1).
 */
export const ACTION_TOAST_DURATION_MS = 8000;

/** With a screen reader on, every toast stays this many times longer. */
export const SCREEN_READER_DURATION_FACTOR = 2;

/** Long translated messages (de, fr, ru) get a third line before they are cut. */
export const TOAST_MAX_LINES = 3;

/** The most toasts shown at once; older ones are dropped so the stack stays calm. */
export const MAX_VISIBLE_TOASTS = 3;
