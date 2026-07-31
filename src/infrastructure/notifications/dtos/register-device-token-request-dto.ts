import type { DevicePlatform } from '@domain/notifications/device-platform';

// Body of `POST /me/device-token` — the FCM token to push to, and the platform
// it belongs to, which decides how the backend formats the payload.
export interface RegisterDeviceTokenRequestDto {
  token: string;
  platform: DevicePlatform;
}
