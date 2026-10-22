import type { StoreStatus } from '@application/store/store-status';
import type { UserProfileEntity } from '@domain/user-profile/user-profile-entity';

export interface UserProfileLoaded {
  status: typeof StoreStatus.Loaded;
  profile: UserProfileEntity;
}
