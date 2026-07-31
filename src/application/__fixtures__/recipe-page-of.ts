import type { RecipePage } from '@domain/recipes/list/recipe-page';
import type { RecipeSummaryEntity } from '@domain/recipes/recipe-summary-entity';
import { ValueConstants } from '@core/constants';
import { FIRST_PAGE } from '@infrastructure/constants/api';

/**
 * Wraps items as a single complete page — what a test means when it does not
 * care about paging. Pass `total` to describe a page with more behind it.
 */
export const recipePageOf = (
  items: RecipeSummaryEntity[],
  overrides: Partial<Omit<RecipePage, 'items'>> = {},
): RecipePage => {
  const page = overrides.page ?? FIRST_PAGE;
  const pageSize = overrides.pageSize ?? Math.max(items.length, ValueConstants.one);
  const total = overrides.total ?? items.length;
  return { items, page, pageSize, total, hasMore: overrides.hasMore ?? page * pageSize < total };
};
