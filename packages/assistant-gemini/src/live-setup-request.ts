import type { LiveSetupRequestDto } from './dtos/live-setup-request-dto';

/**
 * The first frame on the socket. It only names the model: the instruction, tools
 * and voice are baked into the ephemeral token when it is minted, and the Live
 * API discards whatever a client puts here beyond the model.
 */
export const toLiveSetupRequest = (input: { model: string }): LiveSetupRequestDto => ({
  setup: { model: input.model },
});
