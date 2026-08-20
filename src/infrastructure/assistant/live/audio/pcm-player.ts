import { AudioBufferQueueSourceNode, AudioContext } from 'react-native-audio-api';
import { DiagnosticMessage } from '@core/failure/diagnostic-message';
import type { AudioPlayerInterface } from '@domain/assistant/audio-player-interface';
import type { Failure } from '@core/failure/failure';
import type { Result } from '@core/result/result';
import { UnknownFailure } from '@core/failure/kinds/unknown-failure';
import { ValueConstants } from '@core/constants';

/**
 * Streaming playback of the assistant's reply, over `react-native-audio-api`.
 *
 * @remarks
 * - **A queue source, not a buffer per chunk.** The reply arrives as a long
 *   series of small chunks; starting a source node for each one leaves audible
 *   seams between them, because each start is scheduled against the context
 *   clock separately. One queue node plays them back to back.
 * - **`clearBuffers` IS the interruption.** It drops everything enqueued but
 *   not yet heard in a single call — no bookkeeping of which chunk is playing,
 *   which is the part that would have gone wrong under a race.
 * - **The context runs at the stream's rate**, so the platform resamples to
 *   the output device rather than this code doing it per chunk on the JS
 *   thread while chunks are still arriving.
 */
const MONO = 1;

export class PcmPlayer implements AudioPlayerInterface {
  private context: AudioContext | null = null;
  private queue: AudioBufferQueueSourceNode | null = null;

  async prepare(sampleRate: number): Promise<Result<void, Failure>> {
    if (this.queue !== null) return { ok: true, value: undefined };

    try {
      const context = new AudioContext({ sampleRate });
      const queue = context.createBufferQueueSource();
      queue.connect(context.destination);
      queue.start();

      this.context = context;
      this.queue = queue;
      return { ok: true, value: undefined };
    } catch (error) {
      await this.stop();
      const reason = error instanceof Error ? error.message : DiagnosticMessage.crypto.unknownReason;
      return { ok: false, failure: new UnknownFailure(DiagnosticMessage.assistant.playerUnavailable(reason)) };
    }
  }

  enqueue(samples: Float32Array<ArrayBuffer>): void {
    const context = this.context;
    const queue = this.queue;
    if (context === null || queue === null || samples.length === ValueConstants.zero) return;

    const buffer = context.createBuffer(MONO, samples.length, context.sampleRate);
    buffer.copyToChannel(samples, ValueConstants.zero);
    queue.enqueueBuffer(buffer);
  }

  flush(): void {
    this.queue?.clearBuffers();
  }

  async stop(): Promise<void> {
    const context = this.context;
    this.queue?.clearBuffers();
    this.queue?.stop();
    this.queue = null;
    this.context = null;
    await context?.close();
  }
}
