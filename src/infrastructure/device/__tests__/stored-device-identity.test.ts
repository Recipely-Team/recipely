import { fail, ok } from '@core/result/result-helpers';
import type { Result } from '@core/result/result';
import { UnknownFailure, type Failure } from '@core/failure';
import { DevicePlatform } from '@domain/notifications/device-platform';
import type { KeyValueStoreInterface } from '@domain/storage/key-value-store-interface';
import { StoredDeviceIdentity } from '@infrastructure/device/stored-device-identity';
import { DEVICE_ID_STORAGE_KEY } from '@infrastructure/constants/storage';

/** An in-memory key-value store; the application fixture is out of this layer's reach. */
class MemoryStore implements KeyValueStoreInterface {
  private readonly entries = new Map<string, string>();

  getItem(key: string): Promise<Result<string | null, Failure>> {
    return Promise.resolve(ok(this.entries.get(key) ?? null));
  }

  setItem(key: string, value: string): Promise<Result<void, Failure>> {
    this.entries.set(key, value);
    return Promise.resolve(ok(undefined));
  }

  removeItem(key: string): Promise<Result<void, Failure>> {
    this.entries.delete(key);
    return Promise.resolve(ok(undefined));
  }

  seed(key: string, value: string): void {
    this.entries.set(key, value);
  }

  peek(key: string): string | null {
    return this.entries.get(key) ?? null;
  }
}

const makeIdGenerator = (): jest.Mock<string, []> => {
  let next = 0;
  return jest.fn(() => {
    next += 1;
    return `generated-${next}`;
  });
};

describe('StoredDeviceIdentity', () => {
  it('mints an id on first use and persists it', async () => {
    const store = new MemoryStore();
    const identity = new StoredDeviceIdentity(store, makeIdGenerator(), DevicePlatform.Android, '1.0.50');

    const result = await identity.current();

    expect(result).toEqual(ok({ deviceId: 'generated-1', platform: DevicePlatform.Android, appVersion: '1.0.50' }));
    expect(store.peek(DEVICE_ID_STORAGE_KEY)).toBe('generated-1');
  });

  it('reuses the stored id on the next launch instead of minting another', async () => {
    const store = new MemoryStore();
    const generateId = makeIdGenerator();
    await new StoredDeviceIdentity(store, generateId, DevicePlatform.Web, null).current();

    const nextLaunch = new StoredDeviceIdentity(store, generateId, DevicePlatform.Web, null);
    const result = await nextLaunch.current();

    expect(result.ok && result.value.deviceId).toBe('generated-1');
    expect(generateId).toHaveBeenCalledTimes(1);
  });

  it('mints once when a login and the heartbeat ask at the same time', async () => {
    const store = new MemoryStore();
    const generateId = makeIdGenerator();
    const identity = new StoredDeviceIdentity(store, generateId, DevicePlatform.Ios, '1.0.50');

    const [a, b] = await Promise.all([identity.current(), identity.current()]);

    expect(a).toEqual(b);
    expect(generateId).toHaveBeenCalledTimes(1);
  });

  it('replaces a stored id the backend would refuse', async () => {
    const store = new MemoryStore();
    store.seed(DEVICE_ID_STORAGE_KEY, 'x'.repeat(129));
    const identity = new StoredDeviceIdentity(store, makeIdGenerator(), DevicePlatform.Ios, '1.0.50');

    const result = await identity.current();

    expect(result.ok && result.value.deviceId).toBe('generated-1');
  });

  it('answers a failure, not an unsaved id, when the write fails — and retries next time', async () => {
    const store = new MemoryStore();
    let writes = 0;
    const flaky = {
      getItem: (key: string) => store.getItem(key),
      removeItem: (key: string) => store.removeItem(key),
      setItem: (key: string, value: string): Promise<Result<void, Failure>> => {
        writes += 1;
        return writes === 1 ? Promise.resolve(fail(new UnknownFailure('disk full'))) : store.setItem(key, value);
      },
    };
    const identity = new StoredDeviceIdentity(flaky, makeIdGenerator(), DevicePlatform.Ios, null);

    expect((await identity.current()).ok).toBe(false);
    expect((await identity.current()).ok).toBe(true);
  });
});
