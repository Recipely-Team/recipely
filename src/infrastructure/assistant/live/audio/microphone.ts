import { AudioManager, AudioRecorder } from 'react-native-audio-api';
import { DiagnosticMessage } from '@core/failure/diagnostic-message';
import type { Failure } from '@core/failure/failure';
import type { MicrophoneInterface } from '@domain/assistant/audio/microphone-interface';
import type { Result } from '@core/result/result';
import { UnknownFailure } from '@core/failure/kinds/unknown-failure';
import { ValidationFailure } from '@core/failure/kinds/validation-failure';
import { ValueConstants } from '@core/constants';
import { resample } from '@infrastructure/assistant/live/pcm-codec';

/**
 * Microphone capture for the voice assistant, over `react-native-audio-api`.
 *
 * @remarks
 * - **`voiceChat` mode is what makes interruption possible at all.** It turns
 *   on the platform's echo canceller, and without it the microphone hears the
 *   assistant's own reply coming out of the speaker: the model detects speech,
 *   decides it has been interrupted, and cuts itself off mid-sentence with
 *   nobody having said anything. The category has to be `playAndRecord` for
 *   the same reason — capture and playback run at once, not in turns.
 * - **The requested rate is a wish; the delivered rate is a fact.** The
 *   recorder documents `sampleRate` as a preference, so every frame is
 *   converted from the rate the buffer actually reports rather than from the
 *   one that was asked for. Frames sent at the wrong rate do not error — the
 *   model simply hears them sped up, which is far harder to notice.
 * - **Permission is requested here** so no caller can reach `start` without it,
 *   and a refusal comes back as a `Result` like any other failure.
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
        return { ok: false, failure: new ValidationFailure(DiagnosticMessage.assistant.microphoneDenied) };
      }
      return { ok: true, value: undefined };
    } catch {
      return { ok: false, failure: new ValidationFailure(DiagnosticMessage.assistant.microphoneDenied) };
    }
  }

  async start(
    sampleRate: number,
    onFrame: (samples: Float32Array<ArrayBuffer>) => void,
  ): Promise<Result<void, Failure>> {
    if (this.recorder !== null) return { ok: true, value: undefined };

    const access = await this.ensureAccess();
    if (!access.ok) return access;

    try {
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
      await this.stop();
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
