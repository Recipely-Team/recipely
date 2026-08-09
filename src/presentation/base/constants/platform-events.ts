/**
 * `KeyboardEvent.key`, a web-only vocabulary spelled exactly as the DOM reports
 * it — `'Esc'` is the legacy name some browsers still send, so the constant is
 * the place to widen that if it ever matters.
 *
 * `AppStateStatusValue` used to live here too; it moved to
 * `@infrastructure/constants/app-state-status` when the crash sentinel needed
 * the same words from a layer that cannot import presentation.
 */
export const KeyboardKey = {
  escape: 'Escape',
} as const;
