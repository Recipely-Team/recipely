/**
 * How the analysing step paces itself. The scan is one request for every
 * photo, so "Photo 2 of 3" is a reading cue, not a measurement: the highlight
 * moves on every `photoMs` and stays on the last photo until the answer lands.
 */
export const ScanTiming = {
  photoMs: 1800,
} as const;
