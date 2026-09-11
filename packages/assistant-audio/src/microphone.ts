import { Platform } from 'react-native';
import { AudioManager, AudioRecorder } from 'react-native-audio-api';
import { AssistantFailureCode, LevelTimeline, fail, ok, resample } from '@live-assistant/core';
import type { AssistantFailure, AssistantMicrophone, Result } from '@live-assistant/core';

/**
 * Microphone capture on iOS and Android, over `react-native-audio-api`.
 *
 * @remarks
 * - **The requested rate is a wish; the delivered rate is a fact.** The
 *   recorder documents `sampleRate` as a preference, so every frame is
 *   converted from the rate the buffer actually reports. Frames sent at the
 *   wrong rate do not error — the model simply hears them sped up.
 * - **Echo cancellation is iOS-only, and the split is the library's.**
 *   `voiceChat` puts the session on Apple's Voice-Processing I/O unit, which
 *   cancels the app's own output. Android's recorder opens its input without
 *   the `VoiceCommunication` preset that engages the platform's canceller, so
 *   `cancelsEcho` is false there and the caller should stop sending while the
 *   assistant is audible.
 * - **The audio session is exclusive until it is handed back.** Left active
 *   after a failed or finished capture, it keeps the user's music silent until
 *   the app restarts — so every exit path deactivates it.
 * - **`level()` lags what was said by one frame (~100 ms).** A frame arrives
 *   when it has been captured, and its slices are laid out from that moment.
 */
// 100 ms at 16 kHz: prompt enough for the model, and not a socket write per 20 ms.
const BUFFER_FRAMES = 1600;
const MONO = 1;
const FIRST_CHANNEL = 0;
const MS_PER_SECOND = 1000;
// The library's own word for a granted permission — see its `PermissionStatus`.
const PERMISSION_GRANTED = 'Granted';

const reasonOf = (error: unknown): string | undefined => (error instanceof Error ? error.message : undefined);

export class Microphone implements AssistantMicrophone {
  readonly cancelsEcho = Platform.OS === 'ios';

  private recorder: AudioRecorder | null = null;
  private readonly levels = new LevelTimeline();

  constructor(private readonly clock: () => number = () => Date.now() / MS_PER_SECOND) {}

  level(): number {
    return this.levels.levelAt(this.clock());
  }

  async ensureAccess(): Promise<Result<void, AssistantFailure>> {
    // This can THROW rather than resolve: the Android module force-unwraps
    // `currentActivity`, which is absent while the app is backgrounded.
    try {
      const permission = await AudioManager.requestRecordingPermissions();
      return permission === PERMISSION_GRANTED ? ok(undefined) : fail({ code: AssistantFailureCode.MicrophoneDenied });
    } catch (error) {
      return fail({ code: AssistantFailureCode.MicrophoneDenied, detail: reasonOf(error) });
    }
  }

  async start(
    sampleRate: number,
    onFrame: (samples: Float32Array<ArrayBuffer>) => void,
  ): Promise<Result<void, AssistantFailure>> {
    const access = await this.ensureAccess();
    if (!access.ok) return access;

    try {
      // Restarting replaces the callback: keeping the old one sent frames to a
      // closure belonging to a session that had ended.
      if (this.recorder !== null) await this.stop();

      AudioManager.setAudioSessionOptions({
        iosCategory: 'playAndRecord',
        iosMode: 'voiceChat',
        iosOptions: ['defaultToSpeaker', 'allowBluetoothHFP'],
      });
      await AudioManager.setAudioSessionActivity(true);

      const recorder = new AudioRecorder();
      recorder.onAudioReady({ sampleRate, bufferLength: BUFFER_FRAMES, channelCount: MONO }, (event) => {
        const samples = resample(event.buffer.getChannelData(FIRST_CHANNEL), event.buffer.sampleRate, sampleRate);
        this.levels.push(samples, sampleRate, this.clock());
        onFrame(samples);
      });
      await recorder.start();
      this.recorder = recorder;
      return ok(undefined);
    } catch (error) {
      // `stop()` returns early while `this.recorder` is null — which it is if
      // the constructor or `start()` threw — so the session is handed back here.
      await this.stop();
      await AudioManager.setAudioSessionActivity(false).catch(() => undefined);
      return fail({ code: AssistantFailureCode.MicrophoneUnavailable, detail: reasonOf(error) });
    }
  }

  async stop(): Promise<void> {
    this.levels.clear();
    const recorder = this.recorder;
    this.recorder = null;
    if (recorder === null) return;

    recorder.clearOnAudioReady();
    await recorder.stop();
    await AudioManager.setAudioSessionActivity(false);
  }
}
