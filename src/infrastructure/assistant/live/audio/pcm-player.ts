import { PcmPlayer as LibraryPlayer } from '@live-assistant/audio';
import type { AssistantPlayer } from '@live-assistant/core';
import { toAppFailure } from '@infrastructure/assistant/live/to-app-failure';
import type { AudioPlayerInterface } from '@domain/assistant/audio/audio-player-interface';
import type { Failure } from '@core/failure/failure';
import { fail, ok } from '@core/result/result-helpers';
import type { Result } from '@core/result/result';

/**
 * The app's playback of the assistant's voice, served by `@live-assistant/audio`.
 *
 * The library picks the platform and answers with failure codes; this maps them
 * onto the app's `Failure` kinds and otherwise passes every call through.
 */
export class PcmPlayer implements AudioPlayerInterface {
  constructor(private readonly output: AssistantPlayer = new LibraryPlayer()) {}

  async prepare(sampleRate: number): Promise<Result<void, Failure>> {
    const prepared = await this.output.prepare(sampleRate);
    return prepared.ok ? ok(undefined) : fail(toAppFailure(prepared.failure));
  }

  enqueue(samples: Float32Array<ArrayBuffer>): void {
    this.output.enqueue(samples);
  }

  flush(): void {
    this.output.flush();
  }

  stop(): Promise<void> {
    return this.output.stop();
  }
}
