import type { InstagramConnectionStatusType } from '@domain/instagram/connect/instagram-connection-status';

export interface InstagramConnectionProps {
  /** False when the server has no Instagram app configured: the whole feature is hidden. */
  readonly available: boolean;
  readonly connected: boolean;
  readonly username: string | null;
  readonly status: InstagramConnectionStatusType | null;
  /** When Instagram stops (or stopped) accepting the connection. */
  readonly tokenExpiresAt: Date | null;
  readonly connectedAt: Date | null;
}
