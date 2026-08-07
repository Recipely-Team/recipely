import { StoreStatus } from '@application/store/store-status';
import { ValueConstants } from '@core/constants';

/**
 * True while a tab has nothing to show yet AND its answer is still coming.
 *
 * @remarks
 * - **Both halves matter.** Without the status the screen cannot tell an empty
 *   list from an unanswered one, and rendered "nothing here yet" during every
 *   cold load. Without the count, a re-focus reload would rip rows the user is
 *   already reading off the screen and replace them with a skeleton.
 * - It reads a bare `status` rather than a state union so all three tabs — whose
 *   loaded states carry different payloads — can share one predicate.
 */
export const isFirstLoad = (status: StoreStatus, itemCount: number): boolean =>
  itemCount === ValueConstants.zero &&
  (status === StoreStatus.Idle || status === StoreStatus.Loading);
