import type { LevelSource } from '../levels/level-source';
import type { AssistantFailure } from '../result/failure';
import type { Result } from '../result/result';

/**
 * Streaming playback of the assistant's voice.
 *
 * @remarks
 * - **A queue, because of `flush`.** The model keeps producing audio for a
 *   moment after the user talks over it; what the user must not hear is the
 *   assistant finishing a sentence it was told to abandon. `flush` drops
 *   everything not yet heard — the whole interruption gesture.
 * - **`enqueue` never awaits.** Chunks arrive faster than they play, and a
 *   caller that awaited each one would stall the socket's read loop.
 * - **The rate belongs to the stream, not the device.** `prepare` is told the
 *   provider's output rate once and the implementation meets the hardware.
 * - **`level()` is what the user is HEARING**, not what just arrived: levels
 *   follow the playhead, so an animation moves with the words.
 */
export interface AssistantPlayer extends LevelSource {
  /** Opens the output graph for a stream of `sampleRate` mono float samples. */
  prepare(sampleRate: number): Promise<Result<void, AssistantFailure>>;

  /** Appends samples to the tail of the queue and returns immediately. */
  enqueue(samples: Float32Array<ArrayBuffer>): void;

  /** Seconds of queued audio the user has not heard yet — 0 when nothing is playing. */
  remainingSeconds(): number;

  /** Drops everything queued but not yet heard. */
  flush(): void;

  /** Stops playback and releases the output graph. Safe to call when idle. */
  stop(): Promise<void>;
}
