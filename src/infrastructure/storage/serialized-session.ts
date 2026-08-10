import type { SerializedSessionUser } from '@infrastructure/storage/serialized-session-user';

export interface SerializedSession {
  id: string;
  accessToken: string;
  refreshToken?: string;
  expiresAt: string;
  user: SerializedSessionUser;
}
