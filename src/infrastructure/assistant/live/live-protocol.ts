/**
 * The words the Live API's wire format is spelled with, defined once.
 *
 * The setup frame names the tool and the schema types; the session frames name
 * the same tool again when answering a call, and name the audio format on every
 * frame it sends. Written out at each site, the tool declared and the tool
 * responded to could differ by a character — and a mismatched name is answered
 * with silence, not an error, so the conversation would simply stop.
 */
export const LiveProtocol = {
  toolName: 'runAction',
  /** What the microphone sends. The model answers at 24 kHz, not this rate. */
  inputAudioMime: 'audio/pcm;rate=16000',
  audioModality: 'AUDIO',
  objectType: 'OBJECT',
  stringType: 'STRING',
  actionProperty: 'action',
} as const;
