import { ok } from '@core/result/result-helpers';
import type { Result } from '@core/result/result';
import type { Failure } from '@core/failure';
import type { DeviceIdentity } from '@domain/device/device-identity';
import type { DeviceRepositoryInterface } from '@domain/device/device-repository-interface';
import { ApiRoutes } from '@infrastructure/constants/api/api-routes';
import type { AxiosHttpClient } from '@infrastructure/network/http/axios-http-client';
import { toDeviceContextDto } from '@infrastructure/device/to-device-context-dto';

/** Implements `DeviceRepositoryInterface` against `POST /me/devices` (answers 204). */
export class DeviceRepository implements DeviceRepositoryInterface {
  constructor(private readonly http: AxiosHttpClient) {}

  async recordDevice(identity: DeviceIdentity): Promise<Result<void, Failure>> {
    const result = await this.http.post<unknown>(ApiRoutes.me.devices, toDeviceContextDto(identity));
    if (!result.ok) {
      return result;
    }
    return ok(undefined);
  }
}
