import { rms, toDisplayLevel } from './loudness';

/** One slice of scheduled audio and how loud it is. */
interface LevelWindow {
  readonly start: number;
  readonly end: number;
  readonly level: number;
}

const DEFAULT_WINDOW_SECONDS = 0.02;
/** Past this many spent windows the array is compacted, so it never grows with the session. */
const COMPACT_AFTER = 256;

/**
 * Levels laid out on a clock, so a reading matches what is being HEARD.
 *
 * @remarks
 * - **Why a timeline and not the last chunk's loudness.** A reply arrives from
 *   the socket far faster than it plays — seconds of audio in a few hundred
 *   milliseconds. Measured on arrival, the "assistant is speaking" animation
 *   peaks while the queue fills and is flat for the words the user actually
 *   hears. Each chunk is scheduled where the previous one ends, exactly as the
 *   player schedules it, and `levelAt` reads the slice under the playhead.
 * - **Windows of ~20 ms.** A chunk is hundreds of milliseconds long; one level
 *   for all of it would move a mouth once per chunk. Slicing it gives an
 *   envelope a 60 fps animation can follow.
 * - **Seconds on the caller's clock.** The player passes its audio context's
 *   `currentTime`, the microphone a wall clock; the timeline only needs the
 *   same clock for `push` and `levelAt`.
 */
export class LevelTimeline {
  private windows: LevelWindow[] = [];
  private head = 0;
  private cursor = 0;

  constructor(private readonly windowSeconds: number = DEFAULT_WINDOW_SECONDS) {}

  /** Schedules `samples` to start where the audio already scheduled ends, or at `now`. */
  push(samples: Float32Array, sampleRate: number, now: number): void {
    // Pruned here as well as on read: a session nobody draws still pushes ~50 slices a second.
    this.dropBefore(now);
    if (samples.length === 0 || sampleRate <= 0) return;

    const windowSize = Math.max(1, Math.round(sampleRate * this.windowSeconds));
    let start = Math.max(now, this.cursor);
    for (let from = 0; from < samples.length; from += windowSize) {
      const to = Math.min(from + windowSize, samples.length);
      const end = start + (to - from) / sampleRate;
      this.windows.push({ start, end, level: toDisplayLevel(rms(samples, from, to)) });
      start = end;
    }
    this.cursor = start;
  }

  /** The level of the slice playing at `now`; 0 in a gap or after the end. */
  levelAt(now: number): number {
    this.dropBefore(now);
    const current = this.windows[this.head];
    return current !== undefined && current.start <= now ? current.level : 0;
  }

  /** Seconds of scheduled audio not yet heard at `now`; 0 once it has all played. */
  remainingAt(now: number): number {
    return Math.max(0, this.cursor - now);
  }

  private dropBefore(now: number): void {
    while (this.head < this.windows.length && (this.windows[this.head]?.end ?? 0) <= now) this.head++;
    if (this.head > COMPACT_AFTER) {
      this.windows = this.windows.slice(this.head);
      this.head = 0;
    }
  }

  /** Forgets everything scheduled — the interruption, or the end of a session. */
  clear(): void {
    this.windows = [];
    this.head = 0;
    this.cursor = 0;
  }
}
