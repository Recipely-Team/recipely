import type { Failure } from '@core/failure';
import type { StoreStatus } from '@application/store/store-status';
import type { ViewedUserProfile } from '@domain/user-profile/viewed-user-profile';

/** The creator page's header: the profile as this viewer sees it. */
export type CreatorProfileState =
  | { status: typeof StoreStatus.Idle }
  | { status: typeof StoreStatus.Loading }
  | { status: typeof StoreStatus.Loaded; viewed: ViewedUserProfile }
  | { status: typeof StoreStatus.Error; failure: Failure };
