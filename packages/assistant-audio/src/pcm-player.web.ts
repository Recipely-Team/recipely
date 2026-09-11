import { AssistantFailureCode, LevelTimeline, fail, ok } from '@live-assistant/core';
import type { AssistantFailure, AssistantPlayer, Result } from '@live-assistant/core';

/**
 * Streaming playback in the browser, over the Web Audio graph.
 *
 * @remarks
 * - **Why not the same library as native.** `react-native-audio-api`'s web
 *   build exports no `AudioBufferQueueSourceNode`, so the queue is built from
 *   scheduled source nodes.
 * - **The queue is a clock cursor, not a list.** Each chunk starts exactly
 *   where the previous one ends, which keeps the reply gapless; the cursor is
 *   nudged to `currentTime` when the queue has drained.
 * - **`flush` stops the scheduled nodes** — everything not yet started never
 *   starts, and the level timeline is cleared with it.
 * - **Autoplay policy** suspends a context created outside a user gesture; the
 *   tap that starts the assistant is that gesture, so `resume` resolves there.
 */
const MONO = 1;
const FIRST_CHANNEL = 0;

const reasonOf = (error: unknown): string | undefined => (error instanceof Error ? error.message : undefined);

export class PcmPlayer implements AssistantPlayer {
  private context: AudioContext | null = null;
  private scheduled = new Set<AudioBufferSourceNode>();
  private nextStartTime = 0;
  private streamRate = 0;
  private readonly levels = new LevelTimeline();

  level(): number {
    return this.context === null ? 0 : this.levels.levelAt(this.context.currentTime);
  }

  remainingSeconds(): number {
    return this.context === null ? 0 : this.levels.remainingAt(this.context.currentTime);
  }

  async prepare(sampleRate: number): Promise<Result<void, AssistantFailure>> {
    this.streamRate = sampleRate;
    if (this.context !== null) return ok(undefined);

    try {
      this.context = new AudioContext();
      this.nextStartTime = 0;
      await this.context.resume();
      return ok(undefined);
    } catch (error) {
      await this.stop();
      return fail({ code: AssistantFailureCode.PlayerUnavailable, detail: reasonOf(error) });
    }
  }

  enqueue(samples: Float32Array<ArrayBuffer>): void {
    const context = this.context;
    if (context === null || samples.length === 0) return;

    const buffer = context.createBuffer(MONO, samples.length, this.streamRate);
    buffer.copyToChannel(samples, FIRST_CHANNEL);

    const source = context.createBufferSource();
    source.buffer = buffer;
    source.connect(context.destination);

    const startAt = Math.max(this.nextStartTime, context.currentTime);
    source.start(startAt);
    this.nextStartTime = startAt + buffer.duration;
    this.levels.push(samples, this.streamRate, context.currentTime);

    this.scheduled.add(source);
    source.onended = () => this.scheduled.delete(source);
  }

  flush(): void {
    for (const source of this.scheduled) source.stop();
    this.scheduled.clear();
    this.nextStartTime = this.context?.currentTime ?? 0;
    this.levels.clear();
  }

  async stop(): Promise<void> {
    this.flush();
    const context = this.context;
    this.context = null;
    await context?.close();
  }
}
