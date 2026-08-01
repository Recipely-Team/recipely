import type { Failure } from '@core/failure';
import type { StoreStatus } from '@application/store/store-status';
import type { UserProfileEntity } from '@domain/user-profile/user-profile-entity';

export type UserProfileState =
  | { status: typeof StoreStatus.Idle }
  | { status: typeof StoreStatus.Loading }
  | { status: typeof StoreStatus.Loaded; profile: UserProfileEntity }
  | { status: typeof StoreStatus.Error; failure: Failure };
// TO DO: static status name problem