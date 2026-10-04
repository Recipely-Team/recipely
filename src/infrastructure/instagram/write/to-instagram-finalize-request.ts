import type { RequestMapper } from '@core/mapper/request-mapper';
import type { InstagramFinalizeRequestDto } from '@infrastructure/instagram/write/instagram-finalize-request-dto';

/** The return link's one-time code → `POST /me/instagram/finalize` body. */
export const toInstagramFinalizeRequest: RequestMapper<string, InstagramFinalizeRequestDto> = (code) => ({ code });
