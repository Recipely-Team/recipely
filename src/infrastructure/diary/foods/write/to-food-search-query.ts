import type { RequestMapper } from '@core/mapper/request-mapper';
import { ValueConstants } from '@core/constants';
import type { FoodSearchGroupType } from '@domain/diary/foods/search/food-search-group';
import type { FoodSearchQueryDto } from '@infrastructure/diary/foods/write/food-search-query-dto';
import { toPageQuery } from '@infrastructure/network/paging/to-page-query';

/** What a search caller knows. */
interface FoodSearchRequest {
  query: string;
  group: FoodSearchGroupType | null;
  page: number;
  pageSize: number;
}

/** A search request → `GET /diary/foods/search` query; the query is trimmed and an empty one is not sent. */
export const toFoodSearchQuery: RequestMapper<FoodSearchRequest, FoodSearchQueryDto> = ({ query, group, page, pageSize }) => {
  const q = query.trim();
  return {
    ...(q.length === ValueConstants.zero ? {} : { q }),
    ...(group === null ? {} : { group }),
    ...toPageQuery({ page, pageSize }),
  };
};
