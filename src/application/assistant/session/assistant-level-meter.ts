import { ValueConstants } from '@core/constants';

/** ~12 readings a second: fast enough to look live, slow enough that a 20 ms
 *  capture frame does not re-render the panel. */
const PUBLISH_INTERVAL_MS = 80;
/** Under a fiftieth of the scale no bar moves by a whole pixel at any size the
 *  waveform is drawn, so publishing it would repaint for nothing. */
const MIN_VISIBLE_DELTA = 0.02;
/** Conversational speech sits around 0.1 RMS; this puts a normal voice in the
 *  upper half of the bar and leaves shouting at the top rather than beyond it. */
const DISPLAY_GAIN = 4;
const FULL_SCALE = 1;

/**
 * Turns a stream of audio frames into a level the waveform can be drawn from.
 *
 * @remarks
 * - **It throttles, because the frames cannot.** Audio arrives from the
 *   microphone and from playback dozens of times a second, and every value
 *   that reaches the store re-renders each subscriber. `measure` answers
 *   `null` for a frame that should not be published, which is most of them —
 *   a panel repainted a hundred times a second is a defect, not a waveform.
 * - **RMS, not peak.** A peak reading is decided by single-sample clicks and
 *   sits near the top of the scale the moment anyone speaks; the mean square
 *   tracks loudness the way an ear does.
 * - **The answer is already scaled for a bar.** Speech runs an order of
 *   magnitude below full scale, so a raw RMS drives a waveform that barely
 *   leaves the floor. Callers render this value as it is; scaling it again is
 *   how the bar ends up pinned at the top for a whisper.
 * - **It holds no zero of its own.** `reset` only forgets what it published,
 *   so the store stays the single place that decides the level is silent — a
 *   bar left at half height after hanging up reads as a live microphone.
 */
export class AssistantLevelMeter {
  private publishedAt = ValueConstants.zero;
  private published = ValueConstants.zero;

  /** The level to publish for this frame, or `null` to leave it as it is. */
  measure(samples: Float32Array): number | null {
    const level = loudnessOf(samples);
    const now = Date.now();
    if (now - this.publishedAt < PUBLISH_INTERVAL_MS) return null;
    if (Math.abs(level - this.published) < MIN_VISIBLE_DELTA) return null;

    this.publishedAt = now;
    this.published = level;
    return level;
  }

  /** Forgets the last reading, so the next frame publishes immediately. */
  reset(): void {
    this.publishedAt = ValueConstants.zero;
    this.published = ValueConstants.zero;
  }
}

function loudnessOf(samples: Float32Array): number {
  if (samples.length === ValueConstants.zero) return ValueConstants.zero;

  let sumOfSquares = ValueConstants.zero;
  for (let at = ValueConstants.zero; at < samples.length; at += ValueConstants.one) {
    const sample = samples[at] ?? ValueConstants.zero;
    sumOfSquares += sample * sample;
  }

  const rms = Math.sqrt(sumOfSquares / samples.length);
  return Math.min(rms * DISPLAY_GAIN, FULL_SCALE);
}
