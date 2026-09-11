import { Microphone as LibraryMicrophone } from '@live-assistant/audio';
import type { AssistantMicrophone } from '@live-assistant/core';
import { toAppFailure } from '@infrastructure/assistant/live/to-app-failure';
import type { MicrophoneInterface } from '@domain/assistant/audio/microphone-interface';
import type { Failure } from '@core/failure/failure';
import { fail, ok } from '@core/result/result-helpers';
import type { Result } from '@core/result/result';

/**
 * The app's microphone, served by `@live-assistant/audio`.
 *
 * The library picks the platform (the `.web` file on the web shell) and answers
 * with failure codes; this maps them onto the app's `Failure` kinds, so the
 * session store sees exactly what it saw before the capture code moved.
 */
export class Microphone implements MicrophoneInterface {
  constructor(private readonly capture: AssistantMicrophone = new LibraryMicrophone()) {}

  get cancelsEcho(): boolean {
    return this.capture.cancelsEcho;
  }

  async ensureAccess(): Promise<Result<void, Failure>> {
    const access = await this.capture.ensureAccess();
    return access.ok ? ok(undefined) : fail(toAppFailure(access.failure));
  }

  async start(sampleRate: number, onFrame: (samples: Float32Array<ArrayBuffer>) => void): Promise<Result<void, Failure>> {
    const started = await this.capture.start(sampleRate, onFrame);
    return started.ok ? ok(undefined) : fail(toAppFailure(started.failure));
  }

  stop(): Promise<void> {
    return this.capture.stop();
  }
}
