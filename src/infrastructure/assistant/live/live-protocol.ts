/**
 * The two wire words the client still gets to say, defined once.
 *
 * @remarks
 * - **`toolName` must match what the backend minted the token with.** The
 *   session's tools are declared server-side and cannot be seen from here, so
 *   a response sent under a name that does not match the declaration is
 *   answered with silence rather than an error — the conversation simply stops
 *   mid-turn. That is the one thing across the two repos that has to agree
 *   character for character, which is why it is a named constant on this side
 *   rather than a string typed at the call site.
 * - **The input rate is ours to state; the output rate is not.** The microphone
 *   frame declares 16 kHz because that is what we resample to. The model
 *   answers at 24 kHz regardless, which is why no constant here says so — the
 *   player reads it from the frame.
 */
export const LiveProtocol = {
  toolName: 'runAction',
  inputAudioMime: 'audio/pcm;rate=16000',
} as const;
