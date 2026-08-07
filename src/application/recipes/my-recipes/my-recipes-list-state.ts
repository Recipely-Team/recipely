import type { Failure } from '@core/failure';
import type { StoreStatus } from '@application/store/store-status';

/**
 * The "Created" grid's load.
 *
 * @remarks
 * `Idle` and `Loaded` are deliberately distinct even though both can carry an
 * empty `recipes`: without the difference the screen cannot tell "you have
 * published nothing" from "the answer has not arrived yet", and it rendered the
 * empty state for both — a flash of "no recipes" on every cold open.
 */
export type MyRecipesListState =
  | { status: typeof StoreStatus.Idle }
  | { status: typeof StoreStatus.Loading }
  | { status: typeof StoreStatus.Loaded }
  | { status: typeof StoreStatus.Error; failure: Failure };
