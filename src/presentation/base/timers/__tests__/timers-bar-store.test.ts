/**
 * The docked timers bar is pinned over the content, so parking it is how the
 * user reaches what it covers. That choice has to survive a relaunch, must not
 * be undone by the storage read that resolves after it, and must never turn a
 * keychain failure into a rejection raised from a touch handler.
 */
/* eslint-disable import/first -- jest.mock() must be hoisted above imports */

jest.mock('@infrastructure/constants/storage', () => ({
  TIMERS_BAR_COLLAPSED_STORAGE_KEY: 'recipely.timers.bar.collapsed.v1',
}));

import { container } from '@core/di/container-instance';
import { TOKENS } from '@application/di/tokens';
import { FakeKeyValueStore } from '@application/__fixtures__/fake-key-value-store';
import { timersBarStore } from '@presentation/base/timers/timers-bar-store';
import { ok } from '@core/result/result-helpers';
import type { Result } from '@core/result/result';
import type { Failure } from '@core/failure';

const kvStore = new FakeKeyValueStore();

describe('timersBarStore', () => {
  beforeEach(() => {
    container.register(TOKENS.KeyValueStore, () => kvStore);
    kvStore.clear();
    timersBarStore.setState({ collapsed: false, chosen: false });
  });

  it('reads the parked bar back on the next launch', async () => {
    await timersBarStore.getState().setCollapsed(true);
    timersBarStore.setState({ collapsed: false, chosen: false });

    await timersBarStore.getState().hydrate();

    expect(timersBarStore.getState().collapsed).toBe(true);
  });

  it('starts expanded when nothing was ever stored', async () => {
    await timersBarStore.getState().hydrate();

    expect(timersBarStore.getState().collapsed).toBe(false);
  });

  it('forgets the preference once the bar is expanded again', async () => {
    await timersBarStore.getState().setCollapsed(true);
    await timersBarStore.getState().setCollapsed(false);
    timersBarStore.setState({ collapsed: false, chosen: false });

    await timersBarStore.getState().hydrate();

    expect(timersBarStore.getState().collapsed).toBe(false);
  });

  /**
   * Cold start: the slow storage read resolves AFTER the bar is already on
   * screen and the user has hidden it. Applying the stored default then would
   * pop the bar back over the content they just uncovered.
   */
  it('does not overwrite a choice the user already made on screen', async () => {
    let release = (): void => undefined;
    jest.spyOn(kvStore, 'getItem').mockReturnValueOnce(
      new Promise<Result<string | null, Failure>>((resolve) => {
        release = () => {
          resolve(ok(null));
        };
      }),
    );

    const hydrating = timersBarStore.getState().hydrate();
    await timersBarStore.getState().setCollapsed(true);
    release();
    await hydrating;

    expect(timersBarStore.getState().collapsed).toBe(true);
  });

  it('still collapses when the write fails', async () => {
    jest.spyOn(kvStore, 'setItem').mockRejectedValueOnce(new Error('keychain locked'));

    await expect(timersBarStore.getState().setCollapsed(true)).resolves.not.toThrow();
    expect(timersBarStore.getState().collapsed).toBe(true);
  });

  it('survives a storage read that fails', async () => {
    jest.spyOn(kvStore, 'getItem').mockRejectedValueOnce(new Error('keychain locked'));

    await expect(timersBarStore.getState().hydrate()).resolves.not.toThrow();
    expect(timersBarStore.getState().collapsed).toBe(false);
  });
});
