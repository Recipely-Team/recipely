import type { RequestMapper } from '@core/mapper/request-mapper';
import type { InstagramStartQueryDto } from '@infrastructure/instagram/write/instagram-start-query-dto';

/** The app's return link → `GET /auth/instagram/start` query. */
export const toInstagramStartQuery: RequestMapper<string, InstagramStartQueryDto> = (returnTo) => ({ returnTo });
