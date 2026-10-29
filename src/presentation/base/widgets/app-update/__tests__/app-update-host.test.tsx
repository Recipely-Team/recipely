/**
 * The version check's three outcomes as the user sees them: nothing, a
 * dismissible sheet, or a gate that blocks the whole app.
 */
import { BackHandler, Linking } from 'react-native';
import { act } from 'react-test-renderer';
import { createStore } from 'zustand/vanilla';
import type { AppVersionStore } from '@application/app-version/app-version-store-contract';
import type { AppVersionState } from '@application/app-version/app-version-state';
import type { VersionVerdict } from '@domain/app-version/version-verdict';
import { renderComponent, textContent } from '@presentation/base/test-support/render-component';
import { AppUpdateHost } from '@presentation/base/widgets/app-update/app-update-host';
import { t } from '@presentation/i18n';

const verdict = (overrides: Partial<VersionVerdict> = {}): VersionVerdict => ({
  status: 'updateRequired',
  reason: 'unsupported',
  latestVersion: '1.6.0',
  minimumVersion: '1.4.0',
  storeUrl: 'https://apps.apple.com/app/id1',
  ...overrides,
});

const storeIn = (state: AppVersionState) => {
  const check = jest.fn(async () => undefined);
  const dismissUpdate = jest.fn(async () => undefined);
  const store = createStore<AppVersionStore>(() => ({ state, check, dismissUpdate }));
  return { store, check, dismissUpdate };
};

const pressable = (root: ReturnType<typeof renderComponent>['root'], label: string) =>
  root.find((node) => node.props['accessibilityLabel'] === label && typeof node.props['onPress'] === 'function');

describe('AppUpdateHost', () => {
  it('shows nothing when the build is up to date, and checks on launch', () => {
    const { store, check } = storeIn({ status: 'upToDate' });
    const { root } = renderComponent(<AppUpdateHost />, { appVersionStore: store });
    expect(textContent(root)).toEqual([]);
    expect(check).toHaveBeenCalled();
  });

  it('offers the optional update and lets the user say not now', () => {
    const { store, dismissUpdate } = storeIn({ status: 'updateAvailable', verdict: verdict({ status: 'updateAvailable', reason: null }) });
    const { root } = renderComponent(<AppUpdateHost />, { appVersionStore: store });

    expect(textContent(root)).toContain(t().appVersion.soft.body.replace('{latest}', '1.6.0'));
    act(() => (pressable(root, t().appVersion.soft.notNow).props['onPress'] as () => void)());
    expect(dismissUpdate).toHaveBeenCalled();
  });

  it('blocks the app when an update is required: store link, try again, back does nothing', () => {
    const openURL = jest.spyOn(Linking, 'openURL').mockResolvedValue(true);
    const addBack = jest.spyOn(BackHandler, 'addEventListener');
    const { store, check } = storeIn({ status: 'updateRequired', verdict: verdict() });
    const { root } = renderComponent(<AppUpdateHost />, { appVersionStore: store });

    expect(textContent(root)).toContain(t().appVersion.required.body);
    const onBack = addBack.mock.calls.find(([event]) => event === 'hardwareBackPress')?.[1];
    expect((onBack as (() => boolean) | undefined)?.()).toBe(true);

    act(() => (pressable(root, t().appVersion.required.updateNow).props['onPress'] as () => void)());
    expect(openURL).toHaveBeenCalledWith('https://apps.apple.com/app/id1');

    check.mockClear();
    act(() => (pressable(root, t().appVersion.required.tryAgain).props['onPress'] as () => void)());
    expect(check).toHaveBeenCalledTimes(1);
  });

  it('says a pulled release has a known problem', () => {
    const { store } = storeIn({ status: 'updateRequired', verdict: verdict({ reason: 'blocked' }) });
    const { root } = renderComponent(<AppUpdateHost />, { appVersionStore: store });
    expect(textContent(root)).toContain(t().appVersion.required.blockedBody);
  });
});
