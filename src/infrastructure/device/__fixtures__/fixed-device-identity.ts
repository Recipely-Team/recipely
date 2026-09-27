import { ok } from '@core/result/result-helpers';
import type { Result } from '@core/result/result';
import type { Failure } from '@core/failure';
import { DevicePlatform } from '@domain/notifications/device-platform';
import type { DeviceIdentity } from '@domain/device/device-identity';
import type { DeviceIdentityInterface } from '@domain/device/device-identity-interface';

/** Test double for `DeviceIdentityInterface` that answers one pre-set `Result`. */
export class FixedDeviceIdentity implements DeviceIdentityInterface {
  /** The identity a test gets unless it asks for another. */
  static readonly defaultIdentity: DeviceIdentity = {
    deviceId: 'install-1',
    platform: DevicePlatform.Ios,
    appVersion: '1.0.50',
  };

  constructor(
    private readonly result: Result<DeviceIdentity, Failure> = ok(FixedDeviceIdentity.defaultIdentity),
  ) {}

  current(): Promise<Result<DeviceIdentity, Failure>> {
    return Promise.resolve(this.result);
  }
}
