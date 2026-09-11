import type { LevelSource } from '../levels/level-source';
import type { AssistantFailure } from '../result/failure';
import type { Result } from '../result/result';

/**
 * The microphone feeding a live session.
 *
 * @remarks
 * - **It promises a rate, it does not request one.** Platform recorders treat
 *   the sample rate as a preference and hand back whatever the hardware runs
 *   at; frames labelled with a rate they are not transcribe as fast noise
 *   rather than failing. Converting to the promised rate is the
 *   implementation's job, so no caller repeats it.
 * - **Asking is a separate step, and it comes first.** A voice session without
 *   a microphone is pointless, so ask before spending a token on one. `start`
 *   still answers `microphone_denied` because access can be revoked in between.
 * - **`level()` is what the user is saying, for drawing.** 0–1, read on an
 *   animation clock, never pushed (see `LevelSource`).
 * - **`cancelsEcho` decides whether the user can interrupt.** With echo
 *   cancellation the microphone can stay open while the assistant speaks;
 *   without it the model hears its own voice as the next instruction, so the
 *   caller should stop sending while the assistant is audible.
 */
export interface AssistantMicrophone extends LevelSource {
  readonly cancelsEcho: boolean;

  /** Asks for access, prompting the user the first time. */
  ensureAccess(): Promise<Result<void, AssistantFailure>>;

  /** Begins capture, delivering mono float samples at exactly `sampleRate`. Restarting replaces `onFrame`. */
  start(sampleRate: number, onFrame: (samples: Float32Array<ArrayBuffer>) => void): Promise<Result<void, AssistantFailure>>;

  /** Ends capture and releases the input device. Safe to call when idle. */
  stop(): Promise<void>;
}
