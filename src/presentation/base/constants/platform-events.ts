/**
 * The values the app compares platform events against.
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
