import type { RecipeSummaryEntity } from '@domain/recipes/recipe-summary-entity';
import { ValueConstants } from '@core/constants';
import { FIRST_PAGE } from '@domain/common/first-page';
import type { Page } from '@domain/common/page';

/**
 * Wraps items as a single complete page — what a test means when it does not
 * care about paging. Pass `total` to describe a page with more behind it.
 */
export const recipePageOf = (
  items: RecipeSummaryEntity[],
  overrides: Partial<Omit<Page<RecipeSummaryEntity>, 'items'>> = {},
): Page<RecipeSummaryEntity> => {
  const page = overrides.page ?? FIRST_PAGE;
  const pageSize = overrides.pageSize ?? Math.max(items.length, ValueConstants.one);
  const total = overrides.total ?? items.length;
  return { items, page, pageSize, total, hasMore: overrides.hasMore ?? page * pageSize < total };
};
