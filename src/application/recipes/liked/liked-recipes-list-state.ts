import type { Failure } from '@core/failure';
import type { StoreStatus } from '@application/store/store-status';

/**
 * The "Liked" grid's load.
 *
 * @remarks
 * The `Idle` / `Loaded` split is what tells an empty grid apart from an
 * unanswered one — without it the tab flashes "you have liked nothing" while
 * its first request is still in flight.
 */
export type LikedRecipesListState =
  | { status: typeof StoreStatus.Idle }
  | { status: typeof StoreStatus.Loading }
  | { status: typeof StoreStatus.Loaded }
  | { status: typeof StoreStatus.Error; failure: Failure };
