import type { DevicePlatform } from '@domain/notifications/device-platform';

// The `device` object on `POST /auth/login`, `/auth/register/verify` and
// `/auth/social`, and the whole body of `POST /me/devices`.
export interface DeviceContextDto {
  deviceId: string;
  platform: DevicePlatform;
  appVersion?: string;
}
