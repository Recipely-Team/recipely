import type { DevicePlatform } from '@domain/notifications/device-platform';

/**
 * Who this install is, as the backend's `devices` table records it.
 *
 * @remarks
 * - **`deviceId` is per install, not per person.** It is minted once and kept
 *   across sign-outs, so one phone shared by two accounts is one device row
 *   for each of them, and a reinstall (or a cleared browser) is a new device.
 * - **`appVersion` is `null` when the build does not publish one** — an
 *   absent value, never a made-up `0.0.0` that reads like an answer.
 */
export interface DeviceIdentity {
  readonly deviceId: string;
  readonly platform: DevicePlatform;
  readonly appVersion: string | null;
}
