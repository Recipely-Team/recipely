import type { LiveSetupRequestDto } from './dtos/live-setup-request-dto';

/**
 * The first frame on the socket. It only names the model: for a token minted
 * with a setup, the instruction, tools and voice are baked in at mint time and
 * the Live API discards whatever a client puts here beyond the model.
 */
export const toLiveSetupRequest = (input: { model: string }): LiveSetupRequestDto => ({
  setup: { model: input.model },
});
