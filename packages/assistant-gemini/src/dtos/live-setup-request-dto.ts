/**
 * The one frame that opens a live session.
 *
 * It carries only the model. For a token minted WITH a setup — the way this
 * package's token server mints them — the session's configuration (system
 * instruction, tools, modality, transcription, compression, resumption) is
 * fixed at mint time and anything sent here is discarded. Whether a token
 * minted without one honours a client's setup is not yet measured. The frame
 * is mandatory either way: without it the session never reaches `setupComplete`.
 */
export interface LiveSetupRequestDto {
  setup: { model: string };
}
