import { AudioManager, AudioRecorder } from 'react-native-audio-api';
import { DiagnosticMessage } from '@core/failure/diagnostic-message';
import type { Failure } from '@core/failure/failure';
import type { MicrophoneInterface } from '@domain/assistant/audio/microphone-interface';
import type { Result } from '@core/result/result';
import { UnknownFailure } from '@core/failure/kinds/unknown-failure';
import { ForbiddenFailure } from '@core/failure/kinds/forbidden-failure';
import { ValueConstants } from '@core/constants';
import { resample } from '@infrastructure/assistant/live/pcm-codec';

/**
 * Microphone capture for the voice assistant, over `react-native-audio-api`.
 *
 * @remarks
 * - **The requested rate is a wish; the delivered rate is a fact.** The
 *   recorder documents `sampleRate` as a preference, so every frame is
 *   converted from the rate the buffer actually reports rather than from the
 *   one that was asked for. Frames sent at the wrong rate do not error — the
 *   model simply hears them sped up, which is far harder to notice.
 * - **Permission is requested here** so no caller can reach `start` without it,
 *   and a refusal comes back as a `Result` like any other failure.
 * - **The session options are iOS-only.** `voiceChat` gives that platform an
 *   echo canceller; Android gets none, because the library exposes none. The
 *   application layer closes the microphone while the assistant speaks
 *   instead — see `speakingUntil` in the session store. Do not read the
 *   options below as protection on both platforms; they are not.
 */
// 100 ms at the wire rate: small enough that the model hears the user promptly,
// large enough that a socket write per frame is not a per-20-ms tax.
const BUFFER_FRAMES = 1600;
const MONO = 1;
// The library's own word for a granted permission — see its `PermissionStatus`.
const PERMISSION_GRANTED = 'Granted';

export class Microphone implements MicrophoneInterface {
  private recorder: AudioRecorder | null = null;

  async ensureAccess(): Promise<Result<void, Failure>> {
    // Wrapped because this can THROW rather than resolve: the Android module
    // reaches for `currentActivity` and force-unwraps it, so an app that is not
    // foregrounded when the call lands raises instead of answering — and a
    // method promising a Result must not be the one to propagate that.
    try {
      const permission = await AudioManager.requestRecordingPermissions();
      if (permission !== PERMISSION_GRANTED) {
        return { ok: false, failure: new ForbiddenFailure(DiagnosticMessage.assistant.microphoneDenied) };
      }
      return { ok: true, value: undefined };
    } catch {
      return { ok: false, failure: new ForbiddenFailure(DiagnosticMessage.assistant.microphoneDenied) };
    }
  }

  async start(
    sampleRate: number,
    onFrame: (samples: Float32Array<ArrayBuffer>) => void,
  ): Promise<Result<void, Failure>> {
    const access = await this.ensureAccess();
    if (!access.ok) return access;

    try {
      // Restarting replaces the callback rather than reporting success and
      // keeping the old one — the frames would have gone to a closure
      // belonging to a session that had ended. Inside the try, because a
      // rejecting native stop must not escape a method promising a Result.
      if (this.recorder !== null) await this.stop();

      AudioManager.setAudioSessionOptions({
        iosCategory: 'playAndRecord',
        iosMode: 'voiceChat',
        iosOptions: ['defaultToSpeaker', 'allowBluetoothHFP'],
      });
      await AudioManager.setAudioSessionActivity(true);

      const recorder = new AudioRecorder();
      recorder.onAudioReady({ sampleRate, bufferLength: BUFFER_FRAMES, channelCount: MONO }, (event) => {
        const samples = event.buffer.getChannelData(ValueConstants.zero);
        onFrame(resample(samples, event.buffer.sampleRate, sampleRate));
      });
      await recorder.start();
      this.recorder = recorder;
      return { ok: true, value: undefined };
    } catch (error) {
      // `stop()` returns early when `this.recorder` is still null — which it is
      // if the constructor or `start()` threw — so the session is handed back
      // here explicitly. Left active it is exclusive: the user's music stays
      // dead until the app is restarted, after a failed attempt to talk.
      await this.stop();
      await AudioManager.setAudioSessionActivity(false).catch(() => undefined);
      const reason = error instanceof Error ? error.message : DiagnosticMessage.crypto.unknownReason;
      return { ok: false, failure: new UnknownFailure(DiagnosticMessage.assistant.microphoneUnavailable(reason)) };
    }
  }

  async stop(): Promise<void> {
    const recorder = this.recorder;
    this.recorder = null;
    if (recorder === null) return;

    recorder.clearOnAudioReady();
    await recorder.stop();
    // The session stays exclusive until it is handed back, which would leave
    // the user's music dead — the same trap the alarm player documents.
    await AudioManager.setAudioSessionActivity(false);
  }
}
