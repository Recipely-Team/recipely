import { ValueConstants } from '@core/constants';
import type { Page } from '@domain/common/page';
import type { ListPaging } from '@application/store/paging/list-paging/list-paging';

/** The paging a just-landed page leaves the list in. */
export const pagingOf = (page: Page<unknown>): ListPaging => ({
  page: page.page,
  total: page.total,
  pageSize: page.pageSize,
  hasMore: page.hasMore,
  isLoadingMore: false,
  removed: ValueConstants.zero,
  moreFailure: null,
});
