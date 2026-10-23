import type { StoreStatus } from '@application/store/store-status';
import type { InstagramConnection } from '@domain/instagram/connect/instagram-connection';

export interface InstagramConnectionLoaded {
  status: typeof StoreStatus.Loaded;
  connection: InstagramConnection;
}
