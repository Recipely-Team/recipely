import type { Failure } from '@core/failure/failure';
import type { Result } from '@core/result/result';

/**
 * Port for the streaming playback of the assistant's replies.
 *
 * @remarks
 * - **`flush` is the interruption**, and it is why this is a queue rather than
 *   a series of plays. The model keeps producing audio for a moment after the
 *   user talks over it, and the tokens for that audio are already paid; what
 *   the user must not experience is the assistant finishing a sentence it was
 *   told to abandon. Dropping every buffer not yet heard is the whole gesture.
 * - **Enqueue never awaits.** Chunks arrive from the socket faster than they
 *   play, and a caller that awaited each one would stall the read loop and
 *   starve the very queue it is filling.
 * - **The rate belongs to the stream, not the device.** The Live API answers at
 *   24 kHz whatever the output hardware runs at, so `prepare` is told the
 *   stream's rate once and the implementation reconciles it.
 */
export interface AudioPlayerInterface {
  /** Opens the output graph for a stream of `sampleRate` mono float samples. */
  prepare(sampleRate: number): Promise<Result<void, Failure>>;

  /** Appends samples to the tail of the queue and returns immediately. */
  enqueue(samples: Float32Array<ArrayBuffer>): void;

  /** Drops everything queued but not yet heard — the interruption gesture. */
  flush(): void;

  /** Stops playback and releases the output graph. Safe to call when idle. */
  stop(): Promise<void>;
}
