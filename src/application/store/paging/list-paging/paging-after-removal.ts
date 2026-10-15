import type { ListPaging } from '@application/store/paging/list-paging/list-paging';
import { ValueConstants } from '@core/constants';

/** One row left the loaded list: the total drops, and the next page must start that much earlier. */
export const pagingAfterRemoval = (paging: ListPaging): ListPaging => ({
  ...paging,
  total: Math.max(ValueConstants.zero, paging.total - ValueConstants.one),
  removed: paging.removed + ValueConstants.one,
});
