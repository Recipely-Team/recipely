/**
 * Values the app compares platform events against.
 *
 * @remarks
 * - **`AppStateStatus.active`** — the moment a backgrounded app comes back and
 *   has to catch up on what happened while it was away. Two hooks watch for it
 *   and each wrote the literal out.
 * - **`KeyboardKey.escape`** is `KeyboardEvent.key`, a web-only vocabulary
 *   spelled exactly as the DOM reports it — `'Esc'` is the legacy name some
 *   browsers still send, so the constant is the place to widen that if it ever
 *   matters.
 */
export const AppStateStatusValue = {
  active: 'active',
} as const;

export const KeyboardKey = {
  escape: 'Escape',
} as const;

/**
 * Above this the unread badge stops counting and shows `9+`.
 *
 * A two-digit count widens the badge past the circle it is drawn in, and the
 * exact number stops being the point once it is "a lot". Both headers render
 * this badge and each had the threshold written out.
 */
export const UNREAD_BADGE_MAX = 9;

/** What the badge shows once the count passes {@link UNREAD_BADGE_MAX}. */
export const UNREAD_BADGE_OVERFLOW_LABEL = '9+';
