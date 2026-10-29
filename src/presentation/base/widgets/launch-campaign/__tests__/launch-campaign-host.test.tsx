/**
 * When a launch campaign may appear: only over the recipes feed, never over an update prompt,
 * the splash variant only at launch, and every way out remembered as seen.
 */
import { act } from 'react-test-renderer';
import { createStore } from 'zustand/vanilla';
import type { LaunchCampaignStore } from '@application/campaigns/launch-campaign-store-contract';
import type { LaunchCampaignState } from '@application/campaigns/launch-campaign-state';
import type { AppVersionStore } from '@application/app-version/app-version-store-contract';
import type { AppVersionState } from '@application/app-version/app-version-state';
import type { LaunchCampaign } from '@domain/campaigns/launch-campaign';
import { durations } from '@presentation/base/theme';
import { renderComponent, textContent } from '@presentation/base/test-support/render-component';
import { LaunchCampaignHost } from '@presentation/base/widgets/launch-campaign/launch-campaign-host';
import { t } from '@presentation/i18n';

let mockPathname = '/recipes';
const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  usePathname: jest.fn(() => mockPathname),
  useRouter: jest.fn(() => ({ push: mockPush })),
}));

const campaign = (overrides: Partial<LaunchCampaign> = {}): LaunchCampaign => ({
  id: 'ramadan',
  variant: 'splash',
  art: 'crescent',
  colorStart: '#0B1437',
  colorEnd: '#3730A3',
  imageUrl: null,
  title: 'Ramadan Kareem',
  body: 'Iftar ideas for the month',
  ctaLabel: 'See recipes',
  ctaLink: '/recipes?tag=ramadan',
  startsAtMs: 0,
  endsAtMs: 1,
  priority: 0,
  ...overrides,
});

const render = (state: LaunchCampaignState, version: AppVersionState = { status: 'upToDate' }) => {
  const prepare = jest.fn(async () => undefined);
  const dismiss = jest.fn(async () => undefined);
  const launchCampaignStore = createStore<LaunchCampaignStore>(() => ({ state, prepare, dismiss }));
  const appVersionStore = createStore<AppVersionStore>(() => ({
    state: version,
    check: jest.fn(async () => undefined),
    dismissUpdate: jest.fn(async () => undefined),
  }));
  const { root } = renderComponent(<LaunchCampaignHost />, { launchCampaignStore, appVersionStore });
  return { root, prepare, dismiss };
};

const pressable = (root: ReturnType<typeof renderComponent>['root'], label: string) =>
  root.find((node) => node.props['accessibilityLabel'] === label && typeof node.props['onPress'] === 'function');

describe('LaunchCampaignHost', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    mockPathname = '/recipes';
    mockPush.mockClear();
  });
  afterEach(() => jest.useRealTimers());

  it('prepares on launch and shows nothing when there is no campaign', () => {
    const { root, prepare } = render({ status: 'none' });
    expect(prepare).toHaveBeenCalled();
    expect(textContent(root)).toEqual([]);
  });

  it('shows the splash variant under the brand splash, over the feed', () => {
    const { root } = render({ status: 'ready', campaign: campaign() });
    expect(textContent(root)).toEqual(expect.arrayContaining(['Ramadan Kareem', 'Iftar ideas for the month', 'See recipes']));
  });

  it('never shows over onboarding or sign-in', () => {
    mockPathname = '/onboarding';
    expect(textContent(render({ status: 'ready', campaign: campaign() }).root)).toEqual([]);
    mockPathname = '/login';
    expect(textContent(render({ status: 'ready', campaign: campaign({ variant: 'dialog' }) }).root)).toEqual([]);
  });

  it('gives way to an update prompt — one prompt at a time, the update first', () => {
    const { root } = render(
      { status: 'ready', campaign: campaign() },
      { status: 'updateAvailable', verdict: { status: 'updateAvailable', reason: null, latestVersion: '2.0.0', minimumVersion: null, storeUrl: null } },
    );
    expect(textContent(root)).toEqual([]);
  });

  it('a splash campaign that misses the launch waits for the next one, unseen', () => {
    mockPathname = '/onboarding';
    const { root, dismiss } = render({ status: 'ready', campaign: campaign() });
    act(() => jest.advanceTimersByTime(durations.brandSplash + durations.brandSplashFade));
    expect(textContent(root)).toEqual([]);
    expect(dismiss).not.toHaveBeenCalled();
  });

  it('the splash auto-closes after its countdown, once the brand splash has gone', () => {
    const { dismiss } = render({ status: 'ready', campaign: campaign() });
    act(() => jest.advanceTimersByTime(durations.brandSplash + durations.brandSplashFade));
    expect(dismiss).not.toHaveBeenCalled();
    act(() => jest.advanceTimersByTime(durations.campaignCountdown + durations.brandSplashFade));
    expect(dismiss).toHaveBeenCalled();
  });

  it('the dialog waits for the brand splash, then Not now dismisses it', () => {
    const { root, dismiss } = render({ status: 'ready', campaign: campaign({ variant: 'dialog' }) });
    expect(textContent(root)).toEqual([]);
    act(() => jest.advanceTimersByTime(durations.brandSplash + durations.brandSplashFade));
    expect(textContent(root)).toContain('Ramadan Kareem');
    act(() => (pressable(root, t().launchCampaign.notNow).props['onPress'] as () => void)());
    expect(dismiss).toHaveBeenCalled();
  });

  it('the CTA dismisses and opens its in-app link', () => {
    const { root, dismiss } = render({ status: 'ready', campaign: campaign() });
    act(() => (pressable(root, 'See recipes').props['onPress'] as () => void)());
    expect(dismiss).toHaveBeenCalled();
    expect(mockPush).toHaveBeenCalledWith('/recipes?tag=ramadan');
  });
});
