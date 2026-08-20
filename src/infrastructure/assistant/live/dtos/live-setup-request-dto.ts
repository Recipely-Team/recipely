/**
 * The one frame that opens a live session.
 *
 * It carries only the model, because that is all the server reads from it: with
 * an ephemeral token the session's real configuration — system instruction,
 * tools, modality, transcription, compression, resumption — is fixed when the
 * backend mints the token, and anything sent here is discarded. The frame is
 * still mandatory; without it the session never reaches `setupComplete`.
 */
export interface LiveSetupRequestDto {
  setup: { model: string };
}
