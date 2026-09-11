import { AssistantFailureCode, LevelTimeline, fail, ok, resample } from '@live-assistant/core';
import type { AssistantFailure, AssistantMicrophone, Result } from '@live-assistant/core';

/**
 * Microphone capture in the browser, over `getUserMedia`.
 *
 * @remarks
 * - **Why not the same library as native.** `react-native-audio-api`'s web
 *   build ships no `AudioRecorder`; importing it on web yields `undefined`.
 * - **`echoCancellation` is the web spelling of iOS's `voiceChat`.** Off, the
 *   tab's own output re-enters the microphone and the model concludes the user
 *   interrupted it.
 * - **`ScriptProcessorNode`, deprecated and chosen anyway.** `AudioWorklet`
 *   needs its processor served as a separate module URL, which a bundled
 *   package cannot promise. Every current browser still runs a script
 *   processor; the swap is local to this file the day one drops it.
 * - **A refusal and a broken device arrive down the same path.** The browser's
 *   prompt lives inside `getUserMedia`, so only the error's NAME tells a
 *   pressed "Block" from a missing device.
 */
// A power of two, as the API requires; 4096 at 48 kHz is ~85 ms.
const PROCESSOR_BUFFER = 4096;
const MONO = 1;
const FIRST_CHANNEL = 0;
const SILENT = 0;
const MS_PER_SECOND = 1000;
const REFUSAL_NAMES: readonly string[] = ['NotAllowedError', 'SecurityError'];

export class Microphone implements AssistantMicrophone {
  /** `echoCancellation` is requested on the stream below. */
  readonly cancelsEcho = true;

  private stream: MediaStream | null = null;
  private context: AudioContext | null = null;
  private processor: ScriptProcessorNode | null = null;
  private readonly levels = new LevelTimeline();

  constructor(private readonly clock: () => number = () => Date.now() / MS_PER_SECOND) {}

  level(): number {
    return this.levels.levelAt(this.clock());
  }

  async ensureAccess(): Promise<Result<void, AssistantFailure>> {
    // The browser cannot ask ahead of use; all that can be checked is that
    // there is an API to ask with. `start` reports a refusal.
    return navigator.mediaDevices === undefined ? fail({ code: AssistantFailureCode.MicrophoneDenied }) : ok(undefined);
  }

  async start(
    sampleRate: number,
    onFrame: (samples: Float32Array<ArrayBuffer>) => void,
  ): Promise<Result<void, AssistantFailure>> {
    if (this.stream !== null) return ok(undefined);
    if (navigator.mediaDevices === undefined) return fail({ code: AssistantFailureCode.MicrophoneDenied });

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true, channelCount: MONO },
      });
      const context = new AudioContext();
      const source = context.createMediaStreamSource(stream);
      const processor = context.createScriptProcessor(PROCESSOR_BUFFER, MONO, MONO);

      processor.onaudioprocess = (event) => {
        const samples = resample(event.inputBuffer.getChannelData(FIRST_CHANNEL), context.sampleRate, sampleRate);
        this.levels.push(samples, sampleRate, this.clock());
        onFrame(samples);
      };
      source.connect(processor);
      // A script processor only runs while connected to the destination, so
      // it is — through a muted gain.
      const silence = context.createGain();
      silence.gain.value = SILENT;
      processor.connect(silence);
      silence.connect(context.destination);

      this.stream = stream;
      this.context = context;
      this.processor = processor;
      return ok(undefined);
    } catch (error) {
      await this.stop();
      if (error instanceof Error && REFUSAL_NAMES.includes(error.name)) {
        return fail({ code: AssistantFailureCode.MicrophoneDenied, detail: error.message });
      }
      return fail({
        code: AssistantFailureCode.MicrophoneUnavailable,
        detail: error instanceof Error ? error.message : undefined,
      });
    }
  }

  async stop(): Promise<void> {
    this.levels.clear();
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
