import type { Failure } from '@core/failure';
import type { StoreStatus } from '@application/store/store-status';

/**
 * The "Saved" grid's load.
 *
 * @remarks
 * The `Idle` / `Loaded` split is what tells an empty grid apart from an
 * unanswered one — see {@link MyRecipesListState} for the flash of "nothing
 * saved" this exists to prevent.
 */
export type SavedRecipesListState =
  | { status: typeof StoreStatus.Idle }
  | { status: typeof StoreStatus.Loading }
  | { status: typeof StoreStatus.Loaded }
  | { status: typeof StoreStatus.Error; failure: Failure };
