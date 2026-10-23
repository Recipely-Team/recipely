import type { AuthSessionEntity } from '@domain/auth/auth-session-entity';
import type { StoreStatus } from '@application/store/store-status';

export interface Authenticated {
  status: typeof StoreStatus.Authenticated;
  session: AuthSessionEntity;
}
