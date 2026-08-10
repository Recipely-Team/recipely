import type { Mapper } from '@core/mapper/mapper';
import type { Failure } from '@core/failure';
import { ok } from '@core/result/result-helpers';
import type { RecipePage } from '@domain/recipes/list/recipe-page';
import type { RecipesListDto } from '@infrastructure/recipes/dtos/recipes-list-dto';
import { mapRecipeSummaries } from '@infrastructure/recipes/map-recipe-summaries';

/**
 * Paged wire envelope -> `RecipePage`.
 *
 * `hasMore` is computed once here from the backend's own count, so no caller
 * has to guess whether a short page means "the end" or "a filter matched
 * fewer than a page" — the two are indistinguishable from the items alone.
 */
export const toRecipePage: Mapper<RecipesListDto, RecipePage, Failure> = (dto) => {
  const items = mapRecipeSummaries(dto.items);
  if (!items.ok) return items;
  return ok({
    items: items.value,
    total: dto.total,
    page: dto.page,
    pageSize: dto.pageSize,
    hasMore: dto.page * dto.pageSize < dto.total,
  });
};
