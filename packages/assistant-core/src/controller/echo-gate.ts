import type { AssistantMicrophone } from '../audio/assistant-microphone';
import type { AssistantPlayer } from '../audio/assistant-player';

const MS_PER_SECOND = 1000;

/**
 * Decides whether a microphone frame may go to the model while the assistant
 * is talking.
 *
 * @remarks
 * - **Only where the capture path cannot cancel echo.** With a phone on a
 *   counter playing through its loudspeaker, the model heard its own sentence,
 *   took it for the user's next instruction and answered it, out loud, on
 *   repeat. Holding the microphone shut while the assistant is audible cures
 *   that — at the price of a session the user cannot interrupt, so the price
 *   is paid only when `cancelsEcho` is false.
 * - **Plus a tail.** The speaker rings on and the room reflects after the last
 *   sample; reopening exactly on it let the tail back in.
 * - **The player says when its audio ends**, so the gate follows what is
 *   actually queued rather than an estimate made when chunks arrived.
 */
export class EchoGate {
  private quietUntil = 0;

  constructor(
    private readonly microphone: AssistantMicrophone,
    private readonly player: AssistantPlayer,
    private readonly tailMs: number,
    private readonly clock: () => number,
  ) {}

  /** True while a frame captured now would carry the assistant's own voice. */
  isClosed(): boolean {
    if (this.microphone.cancelsEcho) return false;

    const now = this.clock();
    const remainingMs = this.player.remainingSeconds() * MS_PER_SECOND;
    if (remainingMs > 0) this.quietUntil = now + remainingMs + this.tailMs;
    return now < this.quietUntil;
  }

  /** Opens at once — the queued audio was just dropped by an interruption. */
  open(): void {
    this.quietUntil = 0;
  }
}
