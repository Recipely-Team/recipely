import { AudioBufferQueueSourceNode, AudioContext } from 'react-native-audio-api';
import { DiagnosticMessage } from '@core/failure/diagnostic-message';
import type { AudioPlayerInterface } from '@domain/assistant/audio/audio-player-interface';
import type { Failure } from '@core/failure/failure';
import type { Result } from '@core/result/result';
import { UnknownFailure } from '@core/failure/kinds/unknown-failure';
import { ValueConstants } from '@core/constants';
import { resample } from '@infrastructure/assistant/live/pcm-codec';

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
 * - **The context runs at the DEVICE's rate, and the stream is converted to
 *   meet it.** It used to be opened at the stream's rate on the theory that
 *   the platform would resample; asking Android's audio HAL for a rate it does
 *   not run at is a request it may honour, quietly refuse, or crash on. The
 *   conversion costs a pass per chunk on the JS thread and is free when the
 *   rates already agree.
 */
const MONO = 1;

export class PcmPlayer implements AudioPlayerInterface {
  private context: AudioContext | null = null;
  private queue: AudioBufferQueueSourceNode | null = null;
  /** The rate the model sends at, which is not necessarily one the device runs at. */
  private sourceRate = ValueConstants.zero;

  async prepare(sampleRate: number): Promise<Result<void, Failure>> {
    // Set before the early return: a second prepare at a different rate would
    // otherwise be ignored in silence, leaving the buffers labelled with a rate
    // they are not — the same disagreement between label and data this file
    // already had once.
    this.sourceRate = sampleRate;
    if (this.queue !== null) return { ok: true, value: undefined };

    try {
      // Deliberately NOT `new AudioContext({ sampleRate })`. Asking Android's
      // audio HAL for a rate it does not run at is a request it may honour, may
      // quietly refuse, or may crash on — and a native SIGSEGV inside
      // libaudioclient.so is what a device reported. The context is opened at
      // whatever the hardware actually wants and the samples are converted to
      // meet it.
      const context = new AudioContext();
      const queue = context.createBufferQueueSource();
      queue.connect(context.destination);
      // Both arguments are passed explicitly because the library's own default
      // for `offset` is -1 and its own guard rejects -1 — so the no-argument
      // call its types invite throws every time, on every platform.
      queue.start(ValueConstants.zero, ValueConstants.zero);

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

    // The frames arrive at `sourceRate`; the buffer is read back at the
    // context's rate. Labelling them with the context's rate without
    // converting played them at whatever ratio the two happened to have — it
    // only ever sounded right because the context was forced to match.
    const playable = resample(samples, this.sourceRate, context.sampleRate);
    const buffer = context.createBuffer(MONO, playable.length, context.sampleRate);
    buffer.copyToChannel(playable, ValueConstants.zero);
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
