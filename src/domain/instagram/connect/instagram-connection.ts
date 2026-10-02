import { CharConstants } from '@core/constants';
import { InstagramConnectionStatus } from '@domain/instagram/connect/instagram-connection-status';
import type { InstagramConnectionProps } from '@domain/instagram/connect/instagram-connection-props';

const AT = '@';

/**
 * The viewer's Instagram professional account as Recipely holds it — a read
 * model; the token itself never leaves the server.
 *
 * @remarks
 * - **Expired is still connected**: the account and its rules are kept, but
 *   nothing runs until the user reconnects.
 */
export class InstagramConnection {
  private constructor(private readonly props: InstagramConnectionProps) {}

  static of(props: InstagramConnectionProps): InstagramConnection {
    return new InstagramConnection(props);
  }

  /** Nothing linked, feature available — what the screens assume before the first answer. */
  static none(): InstagramConnection {
    return new InstagramConnection({ available: false, connected: false, username: null, status: null, tokenExpiresAt: null, connectedAt: null });
  }

  get isAvailable(): boolean {
    return this.props.available;
  }

  get isConnected(): boolean {
    return this.props.connected;
  }

  get isExpired(): boolean {
    return this.props.connected && this.props.status === InstagramConnectionStatus.Expired;
  }

  /** Connected and accepted — automations can run. */
  get isActive(): boolean {
    return this.props.connected && !this.isExpired;
  }

  get username(): string | null {
    return this.props.username;
  }

  /** `@handle`, or empty when unknown. */
  get displayHandle(): string {
    return this.props.username === null ? CharConstants.empty : `${AT}${this.props.username}`;
  }

  get tokenExpiresAt(): Date | null {
    return this.props.tokenExpiresAt;
  }
}
