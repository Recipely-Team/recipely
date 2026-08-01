import type { RequestMapper } from '@core/mapper/request-mapper';
import type { RecipeFilters } from '@domain/recipes/list/recipe-filters';
import type { RecipeListQueryDto } from '@infrastructure/recipes/dtos/recipe-list-query-dto';
import { FIRST_PAGE, RECIPES_PAGE_SIZE } from '@infrastructure/constants/api';
import { CharConstants, ValueConstants } from '@core/constants';

/**
 * Domain filters -> `GET /recipes` query.
 *
 * Empty filters are omitted rather than sent blank: `search=` asks the backend
 * to match the empty string instead of to stop filtering, and an empty
 * `cuisines=` would do the same. The page defaults here, in the one place that
 * knows the API is 1-based, instead of being hard-coded at the call site — which
 * is how every list request ended up pinned to page 1.
 */
export const toRecipeListQuery: RequestMapper<RecipeFilters | undefined, RecipeListQueryDto> = (
  filters,
) => ({
  page: filters?.page ?? FIRST_PAGE,
  pageSize: RECIPES_PAGE_SIZE,
  ...(filters?.search ? { search: filters.search } : {}),
  ...(filters?.cuisines?.length ? { cuisines: filters.cuisines.join(CharConstants.comma) } : {}),
  ...(filters?.categories?.length ? { categories: filters.categories.join(CharConstants.comma) } : {}),
  ...(filters?.difficulties?.length
    ? { difficulties: filters.difficulties.join(CharConstants.comma) }
    : {}),
  ...(filters?.maxTime !== undefined && filters.maxTime > ValueConstants.zero
    ? { maxTime: filters.maxTime }
    : {}),
  ...(filters?.sort ? { sort: filters.sort } : {}),
  ...(filters?.sortOrder ? { sortOrder: filters.sortOrder } : {}),
});
// TO DO: Çok fazla alt DTO çıkarılabilir