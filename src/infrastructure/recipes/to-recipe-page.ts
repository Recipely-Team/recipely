import type { Mapper } from '@core/mapper/mapper';
import type { Failure } from '@core/failure';
import { ok } from '@core/result/result-helpers';
import { mapRecipeSummaries } from '@infrastructure/recipes/map-recipe-summaries';
import { toPage } from '@infrastructure/network/paging/to-page';
import type { Page } from '@domain/common/page';
import type { RecipeSummaryEntity } from '@domain/recipes/recipe-summary-entity';
import type { PageDto } from '@infrastructure/network/paging/page-dto';
import type { RecipeListItemDto } from '@infrastructure/recipes/dtos/recipe-list-item-dto';

/**
 * Paged wire envelope -> `Page<RecipeSummaryEntity>`.
 *
 * `hasMore` is computed once here from the backend's own count, so no caller
 * has to guess whether a short page means "the end" or "a filter matched
 * fewer than a page" — the two are indistinguishable from the items alone.
 */
export const toRecipePage: Mapper<PageDto<RecipeListItemDto>, Page<RecipeSummaryEntity>, Failure> = (dto) => {
  const items = mapRecipeSummaries(dto.items);
  if (!items.ok) return items;
  return ok(toPage({ ...dto, items: items.value }, ok));
};
