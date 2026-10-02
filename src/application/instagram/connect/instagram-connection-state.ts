import type { Failure } from '@core/failure';
import type { StoreStatus } from '@application/store/store-status';
import type { InstagramConnection } from '@domain/instagram/connect/instagram-connection';

/** The viewer's Instagram link as the store holds it. */
export type InstagramConnectionState =
  | { status: typeof StoreStatus.Idle }
  | { status: typeof StoreStatus.Loading }
  | { status: typeof StoreStatus.Loaded; connection: InstagramConnection }
  | { status: typeof StoreStatus.Error; failure: Failure };
