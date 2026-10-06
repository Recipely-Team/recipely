import { StoreStatus } from '@application/store/store-status';
import type { PagedList } from '@application/store/paging/paged-list';
import { ValueConstants } from '@core/constants';
import type { ListPhaseType } from '@presentation/base/widgets/diary/add-food/list/list-phase';
import { PickPhase } from '@presentation/base/widgets/diary/add-food/list/pick-phase';

/**
 * One face for several lists shown together (the search's groups). Rows
 * that arrived are shown even while another group still loads; the error
 * face only when every asked list failed; idle lists are not asked and
 * do not count.
 */
export const phaseOfLists = (lists: readonly PagedList<unknown>[]): ListPhaseType => {
  const asked = lists.filter((list) => list.status !== StoreStatus.Idle);
  const hasRows = asked.some((list) => list.status === StoreStatus.Loaded && list.items.length > ValueConstants.zero);
  if (hasRows) return { phase: PickPhase.Ready };
  if (asked.length === ValueConstants.zero || asked.some((list) => list.status === StoreStatus.Loading)) return { phase: PickPhase.Loading };
  const failed = asked.find((list) => list.status === StoreStatus.Error);
  if (failed?.status === StoreStatus.Error && asked.every((list) => list.status === StoreStatus.Error)) {
    return { phase: PickPhase.Error, failure: failed.failure };
  }
  return { phase: PickPhase.Empty };
};
