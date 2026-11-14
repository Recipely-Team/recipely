/**
 * The paywall is reachable by voice: the assistant can choose a plan, subscribe
 * and restore, and reads the screen with the store's prices.
 */
import { act } from 'react-test-renderer';
import { createStore } from 'zustand/vanilla';
import { ok } from '@core/result/result-helpers';
import { AssistantAction } from '@domain/assistant/actions/assistant-action-type';
import { AssistantActionError } from '@domain/assistant/actions/assistant-action-error';
import { AssistantActionRegistry } from '@application/assistant/actions/assistant-action-registry';
import type { PremiumStore } from '@application/subscriptions/premium-store-contract';
import type { ApplicationStores } from '@application/di/application-stores';
import { renderComponent } from '@presentation/base/test-support/render-component';
import { PremiumScreen } from '@presentation/app/premium';

jest.mock('expo-router', () => ({ useRouter: () => ({ back: jest.fn(), replace: jest.fn(), canGoBack: () => true }) }));
jest.mock('@presentation/base/feedback/show-toast', () => ({ showSuccessToast: jest.fn() }));

async function setup() {
  const registry = new AssistantActionRegistry();
  const purchase = jest.fn(async () => ok({ isPremium: true, expiresAt: null }));
  const restore = jest.fn(async () => ok(null));
  const premiumStore = createStore<PremiumStore>(() => ({
    entitlement: null,
    hasChecked: true,
    refresh: async () => undefined,
    loadPlans: async () => ok([
      { id: 'premium_monthly', displayPrice: '$4.99' },
      { id: 'premium_yearly', displayPrice: '$39.99' },
    ]),
    purchase,
    restore,
    clear: () => undefined,
  }));
  renderComponent(<PremiumScreen />, { premiumStore, assistantActionRegistry: registry } as unknown as Partial<ApplicationStores>);
  await act(async () => undefined);
  return { registry, purchase, restore };
}

describe('PremiumScreen by voice', () => {
  it('chooses the monthly plan, then subscribes to it', async () => {
    const { registry, purchase } = await setup();

    await act(async () => {
      await registry.run(AssistantAction.ChoosePlan, 'monthly');
    });
    await act(async () => {
      await registry.run(AssistantAction.Subscribe);
    });

    expect(purchase).toHaveBeenCalledWith('premium_monthly');
  });

  it('refuses a plan it does not know', async () => {
    const { registry } = await setup();

    const result = await registry.run(AssistantAction.ChoosePlan, 'weekly');

    expect(result).toMatchObject({ ok: false, error: AssistantActionError.UnknownPlan });
  });

  it('restores purchases', async () => {
    const { registry, restore } = await setup();

    await act(async () => {
      await registry.run(AssistantAction.RestorePurchases);
    });

    expect(restore).toHaveBeenCalled();
  });
});
