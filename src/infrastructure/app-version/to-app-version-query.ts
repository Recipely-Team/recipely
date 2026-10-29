import type { RequestMapper } from '@core/mapper/request-mapper';
import type { AppVersionQueryDto } from '@infrastructure/app-version/app-version-query-dto';

/** The build being asked about, as `GET /app/version` reads it. */
export const toAppVersionQuery: RequestMapper<{ platform: string; version: string }, AppVersionQueryDto> = ({
  platform,
  version,
}) => ({ platform, version });
