import type { UserProfileState } from '@application/user-profile/user-profile-state';

export interface UserProfileStore {
  state: UserProfileState;
  load: (userId: string) => Promise<void>;
  reset: () => void;
}
