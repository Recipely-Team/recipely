import type { UserEntity } from '@domain/auth/user-entity';
export interface AuthSessionEntityProps {
  id: string;
  accessToken: string;
  refreshToken?: string | undefined;
  expiresAt: Date;
  user: UserEntity;
}
