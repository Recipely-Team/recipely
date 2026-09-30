import type { RequestMapper } from '@core/mapper/request-mapper';
import type { RecentFoodsQueryDto } from '@infrastructure/diary/write/recent-foods-query-dto';

/** How many recent foods to ask for → `GET /diary/recent` query. */
export const toRecentFoodsQuery: RequestMapper<number, RecentFoodsQueryDto> = (limit) => ({ limit });
