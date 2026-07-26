import type { Failure } from '@core/failure';
import type { UserProfileEntity } from '@domain/user-profile/user-profile-entity';

export type UserProfileState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'loaded'; profile: UserProfileEntity }
  | { status: 'error'; failure: Failure };
