import type { CreatorSummaryEntity } from '@domain/creators/creator-summary-entity';
import { ValueConstants } from '@core/constants';
import { FIRST_PAGE } from '@infrastructure/constants/api/api-paging';
import type { Page } from '@domain/common/page';

/** Wraps items as one page; pass `total` (or `hasMore`) to describe a page with more behind it. */
export const creatorPageOf = (
  items: CreatorSummaryEntity[],
  overrides: Partial<Omit<Page<CreatorSummaryEntity>, 'items'>> = {},
): Page<CreatorSummaryEntity> => {
  const page = overrides.page ?? FIRST_PAGE;
  const pageSize = overrides.pageSize ?? Math.max(items.length, ValueConstants.one);
  const total = overrides.total ?? items.length;
  return { items, page, pageSize, total, hasMore: overrides.hasMore ?? page * pageSize < total };
};
