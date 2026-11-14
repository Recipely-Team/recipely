/**
 * The paywall: store prices, yearly by default, a silent cancel, a spoken failure,
 * and a clear "subscribe in the app" when there is no store.
 */
import { act, type ReactTestInstance } from 'react-test-renderer';
import { createStore } from 'zustand/vanilla';
import { CancelledFailure, UnknownFailure } from '@core/failure';
import { fail, ok } from '@core/result/result-helpers';
import type { PremiumStore } from '@application/subscriptions/premium-store-contract';
import type { ApplicationStores } from '@application/di/application-stores';
import { en } from '@presentation/i18n/locales/en';
import { renderComponent, textContent } from '@presentation/base/test-support/render-component';
import { PremiumScreen } from '@presentation/app/premium';

const mockRouter = { back: jest.fn(), replace: jest.fn(), canGoBack: jest.fn(() => true) };
jest.mock('expo-router', () => ({ useRouter: () => mockRouter }));
jest.mock('@presentation/base/feedback/show-toast', () => ({ showSuccessToast: jest.fn() }));

const PLANS = [
  { id: 'premium_monthly', displayPrice: '$4.99' },
  { id: 'premium_yearly', displayPrice: '$39.99' },
];

function premiumStore(overrides: Partial<PremiumStore> = {}) {
  return createStore<PremiumStore>(() => ({
    entitlement: null,
    hasChecked: true,
    refresh: async () => undefined,
    loadPlans: async () => ok(PLANS),
    purchase: async () => ok({ isPremium: true, expiresAt: null }),
    restore: async () => ok(null),
    clear: () => undefined,
    ...overrides,
  }));
}

async function render(store = premiumStore()) {
  const view = renderComponent(<PremiumScreen />, { premiumStore: store } as unknown as Partial<ApplicationStores>);
  await act(async () => undefined);
  return view.root;
}

const pressable = (root: ReactTestInstance, text: string): ReactTestInstance => {
  const matches = root.findAll((n) => typeof n.props['onPress'] === 'function' && textContent(n).includes(text));
  const node = matches[matches.length - 1];
  if (node === undefined) throw new Error(`no pressable with "${text}"`);
  return node;
};

const press = (node: ReactTestInstance | undefined): unknown => (node?.props['onPress'] as () => unknown)();

const radios = (root: ReactTestInstance) => root.findAll((n) => n.props['accessibilityRole'] === 'radio' && typeof n.props['onPress'] === 'function');

afterEach(() => jest.clearAllMocks());

describe('PremiumScreen', () => {
  it('shows both plans with the store prices, yearly selected', async () => {
    const root = await render();

    expect(textContent(root)).toEqual(expect.arrayContaining(['$4.99 / month', '$39.99 / year', en.premium.bestValue]));
    const [monthly, yearly] = radios(root);
    expect((monthly?.props['accessibilityState'] as { checked: boolean }).checked).toBe(false);
    expect((yearly?.props['accessibilityState'] as { checked: boolean }).checked).toBe(true);
  });

  it('says where to subscribe when there is no store', async () => {
    const root = await render(premiumStore({ loadPlans: async () => ok([]) }));

    expect(textContent(root)).toContain(en.premium.storeUnavailable);
    expect(radios(root)).toHaveLength(0);
  });

  it('stays quiet when the user cancels the store sheet', async () => {
    const root = await render(premiumStore({ purchase: async () => fail(new CancelledFailure()) }));

    await act(async () => press(pressable(root, en.premium.continue)));

    expect(textContent(root)).not.toContain(en.premium.purchaseFailed);
    expect(mockRouter.back).not.toHaveBeenCalled();
  });

  it('says the purchase failed when the store or backend did', async () => {
    const root = await render(premiumStore({ purchase: async () => fail(new UnknownFailure('offline')) }));

    await act(async () => press(pressable(root, en.premium.continue)));

    expect(textContent(root)).toContain(en.premium.purchaseFailed);
  });

  it('buys the selected plan and closes on success', async () => {
    const purchase = jest.fn(async () => ok({ isPremium: true, expiresAt: null }));
    const root = await render(premiumStore({ purchase }));

    await act(async () => press(radios(root)[0]));
    await act(async () => press(pressable(root, en.premium.continue)));

    expect(purchase).toHaveBeenCalledWith('premium_monthly');
    expect(mockRouter.back).toHaveBeenCalled();
  });

  it('says so when there is nothing to restore', async () => {
    const root = await render();

    await act(async () => press(pressable(root, en.premium.restore)));

    expect(textContent(root)).toContain(en.premium.nothingToRestore);
  });
});
