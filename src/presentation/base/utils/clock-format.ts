/**
 * How a clock reading is padded: `9:05`, never `9:5`.
 *
 * Two digits and a leading zero — the same rule in the countdown and the timer
 * bar, so it is stated once rather than as a bare `padStart(2, '0')` in each.
 * Not the hex pad in `@core/constants`: that one happens to share the width
 * but means "one byte", and the two would drift apart the moment either
 * changed.
 */
export const ClockFormat = {
  digits: 2,
  pad: '0',
} as const;
