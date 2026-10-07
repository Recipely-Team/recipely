/**
 * Android notification-channel tuning values.
 *
 * Lives in infrastructure — not `presentation/base/constants` — because the
 * notification service may only import `@core`, `@domain` and
 * `@infrastructure` (see `ALLOWED_IMPORTS` in `scripts/check-structure.mjs`).
 */

/**
 * Alarm channel vibration pattern, in milliseconds: `[wait, vibrate, wait, …]`.
 * The leading `0` starts the buzz immediately; the three 500ms pulses are what
 * make an alarm distinguishable from an ordinary notification.
 */
export const ALARM_VIBRATION_PATTERN: readonly number[] = [0, 500, 300, 500, 300, 500];

/** Heads-up channel vibration: one short tap, so "5 minutes left" never reads as the alarm. */
export const WARNING_VIBRATION_PATTERN: readonly number[] = [0, 150];
