import { AudioContext } from 'react-native-audio-api';
import type { AudioBufferQueueSourceNode } from 'react-native-audio-api';
import { AssistantFailureCode, LevelTimeline, fail, ok, resample } from '@live-assistant/core';
import type { AssistantFailure, AssistantPlayer, Result } from '@live-assistant/core';

/**
 * Streaming playback on iOS and Android, over `react-native-audio-api`.
 *
 * @remarks
 * - **A queue source, not a buffer per chunk.** Starting a source node for each
 *   small chunk leaves audible seams, because each start is scheduled against
 *   the clock separately. One queue node plays them back to back, and
 *   `clearBuffers` drops everything not yet heard in a single call.
 * - **The context runs at the DEVICE's rate, and the stream is converted to
 *   meet it.** Asking Android's audio HAL for a rate it does not run at is a
 *   request it may honour, quietly refuse, or crash on (a native SIGSEGV in
 *   `libaudioclient.so` was reported). Conversion is free when rates agree.
 * - **`start(0, 0)`, both arguments explicit.** The library's default offset
 *   is -1 and its own guard rejects -1, so the no-argument call throws.
 * - **Levels follow the playhead.** Each chunk is laid on a timeline against
 *   the context's `currentTime` where the previous one ends, as the queue plays
 *   it, so `level()` is the loudness of what is heard now.
 */
const MONO = 1;
const FIRST_CHANNEL = 0;
const IMMEDIATELY = 0;
const FROM_START = 0;

const reasonOf = (error: unknown): string | undefined => (error instanceof Error ? error.message : undefined);

export class PcmPlayer implements AssistantPlayer {
  private context: AudioContext | null = null;
  private queue: AudioBufferQueueSourceNode | null = null;
  /** The rate the provider sends at, not necessarily one the device runs at. */
  private sourceRate = 0;
  private readonly levels = new LevelTimeline();

  level(): number {
    return this.context === null ? 0 : this.levels.levelAt(this.context.currentTime);
  }

  async prepare(sampleRate: number): Promise<Result<void, AssistantFailure>> {
    // Set before the early return: a second prepare at another rate must not
    // leave buffers labelled with a rate they are not.
    this.sourceRate = sampleRate;
    if (this.queue !== null) return ok(undefined);

    try {
      const context = new AudioContext();
      const queue = context.createBufferQueueSource();
      queue.connect(context.destination);
      queue.start(IMMEDIATELY, FROM_START);

      this.context = context;
      this.queue = queue;
      return ok(undefined);
    } catch (error) {
      await this.stop();
      return fail({ code: AssistantFailureCode.PlayerUnavailable, detail: reasonOf(error) });
    }
  }

  enqueue(samples: Float32Array<ArrayBuffer>): void {
    const context = this.context;
    const queue = this.queue;
    if (context === null || queue === null || samples.length === 0) return;

    const playable = resample(samples, this.sourceRate, context.sampleRate);
    const buffer = context.createBuffer(MONO, playable.length, context.sampleRate);
    buffer.copyToChannel(playable, FIRST_CHANNEL);
    queue.enqueueBuffer(buffer);
    this.levels.push(samples, this.sourceRate, context.currentTime);
  }

  flush(): void {
    this.queue?.clearBuffers();
    this.levels.clear();
  }

  async stop(): Promise<void> {
    const context = this.context;
    this.flush();
    this.queue?.stop();
    this.queue = null;
    this.context = null;
    await context?.close();
  }
}
