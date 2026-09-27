import { DevicePlatform } from '@domain/notifications/device-platform';
import { NetworkFailure } from '@core/failure';
import { fail, ok } from '@core/result/result-helpers';
import type { Result } from '@core/result/result';
import { DeviceRepository } from '@infrastructure/device/device-repository';
import { ApiRoutes } from '@infrastructure/constants/api/api-routes';
import { FixedDeviceIdentity } from '@infrastructure/device/__fixtures__/fixed-device-identity';
import { HttpMethod } from '@infrastructure/network/http/http-method';
import { withHttpVerbs } from '@infrastructure/network/http/__fixtures__/with-http-verbs';
import type { HttpClient } from '@infrastructure/network/http/http-client';

interface RequestCall {
  method?: string;
  url?: string;
  data?: unknown;
}

const makeHttp = (result: Result<unknown, unknown>): { http: HttpClient; calls: RequestCall[] } => {
  const calls: RequestCall[] = [];
  const http = withHttpVerbs(jest.fn((config: RequestCall) => {
    calls.push({ method: config.method, url: config.url, data: config.data });
    return Promise.resolve(result);
  }));
  return { http, calls };
};

describe('DeviceRepository.recordDevice', () => {
  it('POSTs the device to /me/devices', async () => {
    const { http, calls } = makeHttp(ok(undefined));

    const result = await new DeviceRepository(http).recordDevice(FixedDeviceIdentity.defaultIdentity);

    expect(result.ok).toBe(true);
    expect(calls).toEqual([
      {
        method: HttpMethod.Post,
        url: ApiRoutes.me.devices,
        data: { deviceId: 'install-1', platform: DevicePlatform.Ios, appVersion: '1.0.50' },
      },
    ]);
  });

  it('passes a transport failure through', async () => {
    const failure = new NetworkFailure('offline');
    const { http } = makeHttp(fail(failure));

    const result = await new DeviceRepository(http).recordDevice(FixedDeviceIdentity.defaultIdentity);

    expect(result).toEqual(fail(failure));
  });
});
