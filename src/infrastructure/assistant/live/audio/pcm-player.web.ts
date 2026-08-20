import { DiagnosticMessage } from '@core/failure/diagnostic-message';
import type { AudioPlayerInterface } from '@domain/assistant/audio/audio-player-interface';
import type { Failure } from '@core/failure/failure';
import type { Result } from '@core/result/result';
import { UnknownFailure } from '@core/failure/kinds/unknown-failure';
import { ValueConstants } from '@core/constants';

/**
 * Streaming playback on the web shell, over the browser's Web Audio graph.
 *
 * @remarks
 * - **Why not the same library as native.** `react-native-audio-api`'s web
 *   build exports no `AudioBufferQueueSourceNode`, so the queue has to be built
 *   out of scheduled source nodes here.
 * - **The queue is a clock cursor, not a list.** Each chunk is scheduled to
 *   start exactly where the previous one ends, which is what keeps the reply
 *   gapless: starting each chunk "now" would leave a seam the length of
 *   whatever jitter the socket introduced. `nextStartTime` is nudged forward to
 *   `currentTime` whenever the queue has drained, or the schedule would run
 *   permanently in the past after a pause.
 * - **`flush` stops the scheduled nodes**, which is the web equivalent of
 *   dropping the queue: audio already handed to the output device is gone
 *   either way, and everything not yet started never starts.
 */
const MONO = 1;

export class PcmPlayer implements AudioPlayerInterface {
  private context: AudioContext | null = null;
  private scheduled = new Set<AudioBufferSourceNode>();
  private nextStartTime = ValueConstants.zero;
  private streamRate = ValueConstants.zero;

  async prepare(sampleRate: number): Promise<Result<void, Failure>> {
    if (this.context !== null) return { ok: true, value: undefined };

    try {
      this.context = new AudioContext();
      this.streamRate = sampleRate;
      this.nextStartTime = ValueConstants.zero;
      // Autoplay policy suspends a context created outside a gesture; the tap
      // that starts the assistant is the gesture, so this resolves there.
      await this.context.resume();
      return { ok: true, value: undefined };
    } catch (error) {
      await this.stop();
      const reason = error instanceof Error ? error.message : DiagnosticMessage.crypto.unknownReason;
      return { ok: false, failure: new UnknownFailure(DiagnosticMessage.assistant.playerUnavailable(reason)) };
    }
  }

  enqueue(samples: Float32Array<ArrayBuffer>): void {
    const context = this.context;
    if (context === null || samples.length === ValueConstants.zero) return;

    const buffer = context.createBuffer(MONO, samples.length, this.streamRate);
    buffer.copyToChannel(samples, ValueConstants.zero);

    const source = context.createBufferSource();
    source.buffer = buffer;
    source.connect(context.destination);

    const startAt = Math.max(this.nextStartTime, context.currentTime);
    source.start(startAt);
    this.nextStartTime = startAt + buffer.duration;

    this.scheduled.add(source);
    source.onended = () => this.scheduled.delete(source);
  }

  flush(): void {
    for (const source of this.scheduled) source.stop();
    this.scheduled.clear();
    this.nextStartTime = this.context?.currentTime ?? ValueConstants.zero;
  }

  async stop(): Promise<void> {
    this.flush();
    const context = this.context;
    this.context = null;
    await context?.close();
  }
}
