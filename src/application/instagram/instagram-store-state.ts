import type { Result } from '@core/result/result';
import type { Failure } from '@core/failure';
import type { InstagramLinkResult } from '@domain/instagram/connect/instagram-link-result';
import type { InstagramConnectionState } from '@application/instagram/connect/instagram-connection-state';

export interface InstagramStoreState {
  connection: InstagramConnectionState;
  /** Reads the link; a loaded one stays on screen while it refreshes. */
  load: () => Promise<void>;
  /** The instagram.com login URL that returns to `returnTo`. */
  startLogin: (returnTo: string) => Promise<Result<string, Failure>>;
  /** Links with the return link's code; the connection updates on success. */
  finalize: (code: string) => Promise<Result<InstagramLinkResult, Failure>>;
  disconnect: () => Promise<Result<void, Failure>>;
  /** Drops the signed-in user's link. Called when the session ends. */
  clear: () => void;
}
