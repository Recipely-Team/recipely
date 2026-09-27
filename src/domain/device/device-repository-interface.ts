import type { Result } from '@core/result/result';
import type { Failure } from '@core/failure';
import type { DeviceIdentity } from '@domain/device/device-identity';

/** Port for the signed-in user's device list on the backend. */
export interface DeviceRepositoryInterface {
  /** Records this device for the caller, or touches it when already known. */
  recordDevice(identity: DeviceIdentity): Promise<Result<void, Failure>>;
}
