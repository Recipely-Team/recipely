import type { ListPaging } from '@application/store/paging/list-paging';
import { ValueConstants } from '@core/constants';

/** A list that has not loaded: nothing held, nothing more to ask for. */
export const NO_PAGING: ListPaging = { page: ValueConstants.zero, total: ValueConstants.zero, hasMore: false, isLoadingMore: false };
