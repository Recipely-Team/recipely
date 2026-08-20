import { DiagnosticMessage } from '@core/failure/diagnostic-message';
import type { Failure } from '@core/failure/failure';
import type { MicrophoneInterface } from '@domain/assistant/audio/microphone-interface';
import type { Result } from '@core/result/result';
import { UnknownFailure } from '@core/failure/kinds/unknown-failure';
import { ValidationFailure } from '@core/failure/kinds/validation-failure';
import { ValueConstants } from '@core/constants';
import { resample } from '@infrastructure/assistant/live/pcm-codec';

/**
 * Microphone capture on the web shell, over `getUserMedia`.
 *
 * @remarks
 * - **Why not the same library as native.** `react-native-audio-api`'s web
 *   build ships no `AudioRecorder` at all — the export simply is not there — so
 *   this is not a stylistic platform split. Importing the native module on web
 *   yields `undefined` and throws at the first `new`.
 * - **`echoCancellation` is the web spelling of `voiceChat` mode.** Same
 *   consequence if it is off: the tab's own speaker output re-enters the
 *   microphone and the model concludes the user interrupted it.
 * - **`ScriptProcessorNode`, deprecated and chosen anyway.** The modern
 *   replacement, `AudioWorklet`, needs its processor served as a separate
 *   module URL, which Expo's web bundler does not produce for a file inside
 *   `src/`. Every current browser still runs a script processor, and this is
 *   the fallback shell rather than the primary surface; the day one drops it,
 *   the swap is local to this file.
 */
// A power of two, as the API requires, and the closest one to the 100 ms frame
// the native side sends: 4096 at 48 kHz is ~85 ms.
const PROCESSOR_BUFFER = 4096;
const MONO = 1;

export class Microphone implements MicrophoneInterface {
  private stream: MediaStream | null = null;
  private context: AudioContext | null = null;
  private processor: ScriptProcessorNode | null = null;

  async start(
    sampleRate: number,
    onFrame: (samples: Float32Array<ArrayBuffer>) => void,
  ): Promise<Result<void, Failure>> {
    if (this.stream !== null) return { ok: true, value: undefined };

    if (navigator.mediaDevices === undefined) {
      return { ok: false, failure: new ValidationFailure(DiagnosticMessage.assistant.microphoneDenied) };
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true, channelCount: MONO },
      });
      const context = new AudioContext();
      const source = context.createMediaStreamSource(stream);
      const processor = context.createScriptProcessor(PROCESSOR_BUFFER, MONO, MONO);

      processor.onaudioprocess = (event) => {
        const samples = event.inputBuffer.getChannelData(ValueConstants.zero);
        onFrame(resample(samples, context.sampleRate, sampleRate));
      };
      source.connect(processor);
      // A script processor only runs while it is connected to the destination,
      // even though nothing here should be audible — hence the muted gain.
      const silence = context.createGain();
      silence.gain.value = ValueConstants.zero;
      processor.connect(silence);
      silence.connect(context.destination);

      this.stream = stream;
      this.context = context;
      this.processor = processor;
      return { ok: true, value: undefined };
    } catch (error) {
      await this.stop();
      // The browser reports a refused prompt as a rejected promise, so a
      // denial and a broken device arrive down the same path.
      const reason = error instanceof Error ? error.message : DiagnosticMessage.crypto.unknownReason;
      return { ok: false, failure: new UnknownFailure(DiagnosticMessage.assistant.microphoneUnavailable(reason)) };
    }
  }

  async stop(): Promise<void> {
    if (this.processor !== null) this.processor.onaudioprocess = null;
    this.processor?.disconnect();
    for (const track of this.stream?.getTracks() ?? []) track.stop();
    const context = this.context;

    this.processor = null;
    this.stream = null;
    this.context = null;
    await context?.close();
  }
}
