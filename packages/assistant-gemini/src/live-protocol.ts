/**
 * The Live API's fixed wire values, defined once.
 *
 * @remarks
 * - **The input rate is the client's to state; the output rate is not.** The
 *   microphone frame declares 16 kHz because that is what the audio layer
 *   resamples to. The model answers at 24 kHz regardless.
 * - **`constrainedWsUrl` is the only socket an ephemeral token opens.** The
 *   ordinary `BidiGenerateContent` method refuses one ("Method doesn't allow
 *   unregistered callers"), measured against the live API.
 */
export const LiveProtocol = {
  constrainedWsUrl:
    'wss://generativelanguage.googleapis.com/ws/' +
    'google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContentConstrained',
  inputAudioMime: 'audio/pcm;rate=16000',
  outputSampleRate: 24_000,
  inputSampleRate: 16_000,
} as const;
