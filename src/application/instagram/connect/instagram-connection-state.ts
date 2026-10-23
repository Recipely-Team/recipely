import type { InstagramConnectionIdle } from '@application/instagram/connect/states/instagram-connection-idle';
import type { InstagramConnectionLoading } from '@application/instagram/connect/states/instagram-connection-loading';
import type { InstagramConnectionLoaded } from '@application/instagram/connect/states/instagram-connection-loaded';
import type { InstagramConnectionError } from '@application/instagram/connect/states/instagram-connection-error';

/** The viewer's Instagram link as the store holds it. */
export type InstagramConnectionState =
  | InstagramConnectionIdle
  | InstagramConnectionLoading
  | InstagramConnectionLoaded
  | InstagramConnectionError;
