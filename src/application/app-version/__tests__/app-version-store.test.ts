import { NetworkFailure, type Failure } from '@core/failure';
import { fail, ok } from '@core/result/result-helpers';
import type { Result } from '@core/result/result';
import { configureAppVersionStore } from '@application/app-version/app-version-store';
import { CheckAppVersionUseCase } from '@application/app-version/check-app-version-use-case';
import { DismissUpdateUseCase } from '@application/app-version/dismiss-update-use-case';
import type { VersionVerdict } from '@domain/app-version/version-verdict';
import type { PreferenceStoreInterface } from '@domain/storage/preference-store-interface';
import { PreferenceSlot } from '@domain/storage/preference-slot';

const verdict = (status: VersionVerdict['status'], latestVersion: string | null = '1.4.0'): VersionVerdict => ({
  status,
  reason: status === 'updateRequired' ? 'unsupported' : null,
  latestVersion,
  minimumVersion: '1.3.0',
  storeUrl: null,
});

const memoryPreferences = (): PreferenceStoreInterface & { values: Map<string, string> } => {
  const values = new Map<string, string>();
  return {
    values,
    get: (slot) => Promise.resolve(ok(values.get(slot) ?? null)),
    set: (slot, value) => {
      values.set(slot, value);
      return Promise.resolve(ok(undefined));
    },
  };
};

const storeAnswering = (answers: Result<VersionVerdict, Failure>[], preferences = memoryPreferences()) => {
  const check = jest.fn();
  for (const answer of answers) check.mockResolvedValueOnce(answer);
  const store = configureAppVersionStore({
    checkAppVersion: new CheckAppVersionUseCase({ check }, preferences),
    dismissUpdate: new DismissUpdateUseCase(preferences),
  });
  return { store, check, preferences };
};

describe('app version store', () => {
  it('shows nothing until the backend answers', () => {
    expect(storeAnswering([]).store.getState().state.status).toBe('unchecked');
  });

  it.each(['upToDate', 'updateAvailable', 'updateRequired'] as const)('takes the backend verdict: %s', async (status) => {
    const { store } = storeAnswering([ok(verdict(status))]);
    await store.getState().check();
    expect(store.getState().state.status).toBe(status);
  });

  // Offline must never lock a user out, and a gate that is up must not drop because the network blinked.
  it('fails open, and keeps a gate that is already up', async () => {
    const { store } = storeAnswering([
      fail(new NetworkFailure('offline')),
      ok(verdict('updateRequired')),
      fail(new NetworkFailure('offline')),
    ]);
    await store.getState().check();
    expect(store.getState().state.status).toBe('unchecked');
    await store.getState().check();
    await store.getState().check();
    expect(store.getState().state.status).toBe('updateRequired');
  });

  it('shares one request between overlapping checks (launch, foreground, a burst of 426s)', async () => {
    const { store, check } = storeAnswering([ok(verdict('upToDate'))]);
    await Promise.all([store.getState().check(), store.getState().check(), store.getState().check()]);
    expect(check).toHaveBeenCalledTimes(1);
  });

  it('"Not now" hides the prompt and remembers that release only', async () => {
    const { store, preferences } = storeAnswering([
      ok(verdict('updateAvailable')),
      ok(verdict('updateAvailable')),
      ok(verdict('updateAvailable', '1.5.0')),
    ]);
    await store.getState().check();
    await store.getState().dismissUpdate();
    expect(store.getState().state.status).toBe('upToDate');
    expect(preferences.values.get(PreferenceSlot.DismissedUpdateVersion)).toBe('1.4.0');

    await store.getState().check();
    expect(store.getState().state.status).toBe('upToDate');
    await store.getState().check();
    expect(store.getState().state.status).toBe('updateAvailable');
  });

  it('a required update ignores an earlier dismissal', async () => {
    const preferences = memoryPreferences();
    preferences.values.set(PreferenceSlot.DismissedUpdateVersion, '1.4.0');
    const { store } = storeAnswering([ok(verdict('updateRequired'))], preferences);
    await store.getState().check();
    expect(store.getState().state.status).toBe('updateRequired');
  });
});
