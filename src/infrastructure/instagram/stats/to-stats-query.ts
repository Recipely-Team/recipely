import type { RequestMapper } from '@core/mapper/request-mapper';
import type { StatsRangeType } from '@domain/instagram/stats/stats-range';
import type { StatsQueryDto } from '@infrastructure/instagram/stats/stats-query-dto';

/** The range → `GET /me/instagram/stats` query. */
export const toStatsQuery: RequestMapper<StatsRangeType, StatsQueryDto> = (days) => ({ days });
