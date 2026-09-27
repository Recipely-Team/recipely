import type { Result } from '@core/result/result';
import type { Failure } from '@core/failure';
import type { DeviceIdentityInterface } from '@domain/device/device-identity-interface';
import type { DeviceRepositoryInterface } from '@domain/device/device-repository-interface';

/**
 * Tells the backend that the signed-in user is on this device.
 *
 * @remarks
 * - **Why a heartbeat on top of the login body.** A session outlives the login
 *   that opened it: every install signed in before devices were reported
 *   would otherwise never appear. The backend upserts, so repeating it is
 *   harmless.
 */
export class RecordDeviceUseCase {
  constructor(
    private readonly identity: DeviceIdentityInterface,
    private readonly devices: DeviceRepositoryInterface,
  ) {}

  async execute(): Promise<Result<void, Failure>> {
    const identity = await this.identity.current();
    if (!identity.ok) {
      return identity;
    }
    return this.devices.recordDevice(identity.value);
  }
}
