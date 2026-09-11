/**
 * How loud a stretch of samples is, as a number a UI can draw with.
 *
 * @remarks
 * - **RMS, not peak.** A peak reading is decided by single-sample clicks and
 *   sits near the top of the scale the moment anyone speaks; the mean square
 *   tracks loudness the way an ear does.
 * - **Decibels, not a linear gain.** Speech runs an order of magnitude below
 *   full scale and whispers another order below that, so a linear scale either
 *   leaves a whisper on the floor or pins a normal voice at the top. Mapping
 *   `-55 dBFS … -5 dBFS` onto `0 … 1` puts conversational speech (~0.1 RMS)
 *   near 0.7 and a whisper near 0.3.
 */
const FLOOR_DB = -55;
const CEILING_DB = -5;
const DB_PER_DECADE = 20;

/** Root-mean-square of `samples[from, to)`. */
export function rms(samples: Float32Array, from = 0, to = samples.length): number {
  if (to <= from) return 0;

  let sumOfSquares = 0;
  for (let at = from; at < to; at++) {
    const sample = samples[at] ?? 0;
    sumOfSquares += sample * sample;
  }
  return Math.sqrt(sumOfSquares / (to - from));
}

/** An RMS value mapped onto 0–1 on a perceptual (decibel) scale. */
export function toDisplayLevel(value: number): number {
  if (value <= 0) return 0;

  const db = DB_PER_DECADE * Math.log10(value);
  return Math.min(1, Math.max(0, (db - FLOOR_DB) / (CEILING_DB - FLOOR_DB)));
}
