/**
 * One frame as the Live API sends it, before anything is trusted about it.
 *
 * @remarks
 * - **Every field is optional because the wire says so.** A frame carries
 *   exactly one of these envelopes, and which one is not discriminated by any
 *   tag — the presence of the key IS the tag. Modelling it as a union here
 *   would be asserting a shape rather than describing one.
 * - **`unknown` for anything nested that gets narrowed later.** The parts of a
 *   model turn are the only place a wrong assumption is invisible: an
 *   `inlineData` that is not base64 audio would decode to noise instead of
 *   throwing, so the mapper checks rather than casts.
 */
export interface LiveServerMessageDto {
  setupComplete?: Record<string, unknown>;
  serverContent?: {
    modelTurn?: { parts?: { inlineData?: { mimeType?: string; data?: string }; text?: string }[] };
    inputTranscription?: { text?: string };
    outputTranscription?: { text?: string };
    interrupted?: boolean;
    turnComplete?: boolean;
    generationComplete?: boolean;
  };
  toolCall?: { functionCalls?: { id?: string; name?: string; args?: Record<string, unknown> }[] };
  sessionResumptionUpdate?: { newHandle?: string; resumable?: boolean };
  goAway?: { timeLeft?: string };
  usageMetadata?: { totalTokenCount?: number };
}
