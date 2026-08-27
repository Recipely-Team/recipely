import type { Failure } from '@core/failure/failure';
import type { Result } from '@core/result/result';

/**
 * Port for the microphone feeding the voice assistant.
 *
 * @remarks
 * - **It promises a rate, it does not request one.** The platform recorder
 *   treats the sample rate as a preference and may hand back whatever the
 *   hardware runs at; the Live API, meanwhile, only understands 16 kHz on the
 *   way in. Frames labelled with a rate they are not transcribe as triple-speed
 *   noise rather than failing, so converting to the promised rate is the
 *   implementation's job and no caller repeats it.
 * - **Frames arrive by callback, not by pull.** Audio is produced by the
 *   hardware on its own clock; a caller that polled would either lag it or
 *   spin, and the socket wants each frame as soon as it exists.
 * - **Asking is a separate step, and it comes first.** It used to be folded
 *   into `start`, which ran LAST — after a token was minted and a socket was
 *   open — so a session that failed earlier never reached it and the user was
 *   never asked for the microphone at all. A voice session without one is
 *   pointless, so the question is asked before anything is spent on it.
 * - **`start` still answers with a failure when access is missing**, because
 *   permission can be revoked between the two calls.
 */
export interface MicrophoneInterface {
  /**
   * Asks for microphone access, prompting the user the first time.
   *
   * Fails when the user refuses, and when the platform cannot ask at all —
   * the Android implementation reaches through the current activity, which
   * is absent if the app is backgrounded as the call is made.
   */
  ensureAccess(): Promise<Result<void, Failure>>;

  /**
   * Begins capture, delivering mono float samples at exactly `sampleRate`.
   *
   * Fails when permission is refused or no input device is available. Safe to
   * call while already running; the existing capture continues.
   */
  start(sampleRate: number, onFrame: (samples: Float32Array<ArrayBuffer>) => void): Promise<Result<void, Failure>>;

  /** Ends capture and releases the input device. Safe to call when idle. */
  stop(): Promise<void>;

  /**
   * Whether this capture path removes the app's own output from what it hears.
   *
   * @remarks
   * The one fact that decides whether the user can interrupt. With echo
   * cancellation the microphone can stay open while the assistant speaks — the
   * loudspeaker's contribution is subtracted before the samples arrive, so a
   * live session hears the room and not itself. Without it the model treats its
   * own sentence as the next instruction and answers it, out loud, on repeat —
   * which is why the session used to stop listening while speaking, and why it
   * could not be interrupted.
   *
   * Declared by the capture layer because only it knows: the platform's echo
   * canceller is engaged by HOW the input is opened, not by anything a screen
   * or a store can see.
   */
  readonly cancelsEcho: boolean;
}
