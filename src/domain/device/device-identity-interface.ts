import type { Result } from '@core/result/result';
import type { Failure } from '@core/failure';
import type { DeviceIdentity } from '@domain/device/device-identity';

/**
 * Port for the current install's identity. The implementation mints the id on
 * first use and persists it, so every later call answers the same id.
 */
export interface DeviceIdentityInterface {
  current(): Promise<Result<DeviceIdentity, Failure>>;
}
