import type { StoreStatus } from '@application/store/store-status';
import type { ViewedUserProfile } from '@domain/user-profile/viewed-user-profile';

export interface CreatorProfileLoaded {
  status: typeof StoreStatus.Loaded;
  viewed: ViewedUserProfile;
}
