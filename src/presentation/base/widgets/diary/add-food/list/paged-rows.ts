import { StoreStatus } from '@application/store/store-status';
import type { PagedList } from '@application/store/paging/paged-list';
import { CharConstants } from '@core/constants';
import type { PickRowEntryType } from '@presentation/base/widgets/diary/add-food/list/pick-row';
import { PickRowType } from '@presentation/base/widgets/diary/add-food/list/pick-row-type';

/**
 * A loaded list's rows, then — while its next page loads or after it failed
 * — one "more" row under them. Nothing for a list that is not loaded.
 */
export const pagedRows = <T>(list: PagedList<T>, listKey: string, toRow: (item: T) => PickRowEntryType): PickRowEntryType[] => {
  if (list.status !== StoreStatus.Loaded) return [];
  const rows = list.items.map(toRow);
  const failed = list.moreFailure !== null;
  if (!list.isLoadingMore && !failed) return rows;
  return [...rows, { type: PickRowType.More, key: [PickRowType.More, listKey].join(CharConstants.colon), listKey, failed }];
};
