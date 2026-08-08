import { ok } from '@core/result/result-helpers';
import type { Result } from '@core/result/result';
import type { Failure } from '@core/failure';
import { LocaleService } from '@application/i18n/locale-service';
import type { KeyValueStoreInterface } from '@domain/storage/key-value-store-interface';
import { LANGUAGE_STORAGE_KEY } from '@infrastructure/constants/storage';

const makeStore = (initial: string | null = null): KeyValueStoreInterface & { saved: string | null } => {
  const store = {
    saved: initial,
    getItem: (): Promise<Result<string | null, Failure>> => Promise.resolve(ok(store.saved)),
    setItem: (_key: string, value: string): Promise<Result<void, Failure>> => {
      store.saved = value;
      return Promise.resolve(ok(undefined));
    },
    removeItem: (): Promise<Result<void, Failure>> => Promise.resolve(ok(undefined)),
  };
  return store;
};

const deviceLocale = (locale: string) => ({ getDeviceLocale: () => locale });

/**
 * A code the app will never ship, used wherever a test needs "a language we do
 * not have". It was `de` until German was added — pick something reserved, or
 * the next language to land quietly turns these assertions inside out.
 */
const UNSUPPORTED = 'zz';

describe('LocaleService', () => {
  it('seeds from the device language when nothing is stored', async () => {
    const service = new LocaleService(makeStore(null), deviceLocale('tr-TR'));

    expect(service.getLocale()).toBe('tr');
    await service.hydrate();
    expect(service.getLocale()).toBe('tr');
  });

  it('falls back to the default locale when the device language is unsupported', () => {
    expect(new LocaleService(makeStore(), deviceLocale(UNSUPPORTED)).getLocale()).toBe('en');
    expect(new LocaleService(makeStore(), deviceLocale('')).getLocale()).toBe('en');
  });

  // The bug this service exists to prevent: a request leaving with the device
  // language while the user has a different language saved.
  it('lets the stored choice win over the device language on hydrate', async () => {
    const service = new LocaleService(makeStore('en'), deviceLocale('tr'));
    expect(service.getLocale()).toBe('tr');

    await service.hydrate();

    expect(service.getLocale()).toBe('en');
  });

  // Every request awaits hydrate(), so it must be a cheap, single-read no-op
  // after the first call — not a storage hit per request.
  it('reads storage once however often hydrate is awaited', async () => {
    const store = makeStore('tr');
    const getItem = jest.spyOn(store, 'getItem');
    const service = new LocaleService(store, deviceLocale('en'));

    await Promise.all([service.hydrate(), service.hydrate()]);
    await service.hydrate();

    expect(getItem).toHaveBeenCalledTimes(1);
    expect(service.getLocale()).toBe('tr');
  });

  it('keeps the device seed when the storage read fails, and retries on the next hydrate', async () => {
    const store = makeStore('en');
    const getItem = jest
      .spyOn(store, 'getItem')
      .mockRejectedValueOnce(new Error('storage unavailable'));
    const service = new LocaleService(store, deviceLocale('tr'));

    await expect(service.hydrate()).resolves.toBeUndefined();
    expect(service.getLocale()).toBe('tr');

    // A failed read must not be cached as "hydrated" — the next request retries.
    await service.hydrate();

    expect(getItem).toHaveBeenCalledTimes(2);
    expect(service.getLocale()).toBe('en');
  });

  // Ordering: a restore still in flight must not undo a language the user picked
  // while it was running.
  it('lets a language picked mid-hydration win over the value being restored', async () => {
    const store = makeStore('en');
    const service = new LocaleService(store, deviceLocale('en'));

    const hydration = service.hydrate();
    service.setLocale('tr');
    await hydration;

    expect(service.getLocale()).toBe('tr');
  });

  it('persists a language switch and notifies subscribers', () => {
    const store = makeStore(null);
    const service = new LocaleService(store, deviceLocale('en'));
    const listener = jest.fn();
    service.subscribe(listener);

    service.setLocale('tr');

    expect(service.getLocale()).toBe('tr');
    expect(store.saved).toBe('tr');
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('ignores a switch to the active locale and to an unsupported one', () => {
    const store = makeStore(null);
    const service = new LocaleService(store, deviceLocale('en'));
    const listener = jest.fn();
    service.subscribe(listener);

    service.setLocale('en');
    service.setLocale(UNSUPPORTED);

    expect(service.getLocale()).toBe('en');
    expect(store.saved).toBeNull();
    expect(listener).not.toHaveBeenCalled();
  });

  it('stops notifying after unsubscribe', () => {
    const service = new LocaleService(makeStore(), deviceLocale('en'));
    const listener = jest.fn();
    const unsubscribe = service.subscribe(listener);

    unsubscribe();
    service.setLocale('tr');

    expect(listener).not.toHaveBeenCalled();
  });

  it('reads and writes the persisted choice under the shared storage key', async () => {
    const store = makeStore(null);
    const service = new LocaleService(store, deviceLocale('en'));
    const setItem = jest.spyOn(store, 'setItem');

    service.setLocale('tr');

    expect(setItem).toHaveBeenCalledWith(LANGUAGE_STORAGE_KEY, 'tr');
  });
});
