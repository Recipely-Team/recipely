import { NetworkFailure, UnknownFailure } from '@core/failure';
import { fail, ok } from '@core/result/result-helpers';
import type { Result } from '@core/result/result';
import type { Failure } from '@core/failure';
import { DevicePlatform } from '@domain/notifications/device-platform';
import type { DeviceIdentity } from '@domain/device/device-identity';
import type { DeviceRepositoryInterface } from '@domain/device/device-repository-interface';
import { RecordDeviceUseCase } from '@application/device/record-device-use-case';

const IDENTITY: DeviceIdentity = { deviceId: 'install-1', platform: DevicePlatform.Web, appVersion: null };

const makeRepo = (
  result: Result<void, Failure> = ok(undefined),
): { repo: DeviceRepositoryInterface; recorded: DeviceIdentity[] } => {
  const recorded: DeviceIdentity[] = [];
  return {
    recorded,
    repo: {
      recordDevice: (identity) => {
        recorded.push(identity);
        return Promise.resolve(result);
      },
    },
  };
};

describe('RecordDeviceUseCase', () => {
  it('records the current identity', async () => {
    const { repo, recorded } = makeRepo();
    const useCase = new RecordDeviceUseCase({ current: () => Promise.resolve(ok(IDENTITY)) }, repo);

    expect((await useCase.execute()).ok).toBe(true);
    expect(recorded).toEqual([IDENTITY]);
  });

  it('sends nothing when the identity cannot be read', async () => {
    const { repo, recorded } = makeRepo();
    const failure = new UnknownFailure('keychain locked');
    const useCase = new RecordDeviceUseCase({ current: () => Promise.resolve(fail(failure)) }, repo);

    expect(await useCase.execute()).toEqual(fail(failure));
    expect(recorded).toEqual([]);
  });

  it('passes a backend failure through for the caller to ignore', async () => {
    const failure = new NetworkFailure('offline');
    const { repo } = makeRepo(fail(failure));
    const useCase = new RecordDeviceUseCase({ current: () => Promise.resolve(ok(IDENTITY)) }, repo);

    expect(await useCase.execute()).toEqual(fail(failure));
  });
});
