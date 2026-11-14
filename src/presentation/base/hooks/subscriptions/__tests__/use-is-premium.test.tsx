/**
 * Premium is shown only for a signed-in account the backend confirmed, and the
 * backend is asked once when nothing is known yet.
 */
import { act } from 'react-test-renderer';
import { Text } from 'react-native';
import { createStore } from 'zustand/vanilla';
import { ok } from '@core/result/result-helpers';
import type { PremiumStore } from '@application/subscriptions/premium-store-contract';
import type { ApplicationStores } from '@application/di/application-stores';
import { renderComponent, textContent } from '@presentation/base/test-support/render-component';
import { useIsPremium } from '@presentation/base/hooks/subscriptions/use-is-premium';

let mockSignedIn = true;
jest.mock('@presentation/base/hooks/auth/use-is-signed-in', () => ({ useIsSignedIn: () => mockSignedIn }));

const Probe = (): React.JSX.Element => <Text>{useIsPremium() ? 'premium' : 'free'}</Text>;

function premiumStore(state: Partial<PremiumStore>) {
  return createStore<PremiumStore>(() => ({
    entitlement: null,
    hasChecked: true,
    refresh: jest.fn(async () => undefined),
    loadPlans: async () => ok([]),
    purchase: async () => ok({ isPremium: true, expiresAt: null }),
    restore: async () => ok(null),
    clear: () => undefined,
    ...state,
  }));
}

async function render(store: ReturnType<typeof premiumStore>) {
  const view = renderComponent(<Probe />, { premiumStore: store } as unknown as Partial<ApplicationStores>);
  await act(async () => undefined);
  return textContent(view.root);
}

afterEach(() => {
  mockSignedIn = true;
});

describe('useIsPremium', () => {
  it('is premium for a signed-in account the backend confirmed', async () => {
    expect(await render(premiumStore({ entitlement: { isPremium: true, expiresAt: null } }))).toEqual(['premium']);
  });

  it('is free when signed out, whatever is stored', async () => {
    mockSignedIn = false;
    const store = premiumStore({ entitlement: { isPremium: true, expiresAt: null }, hasChecked: false });

    expect(await render(store)).toEqual(['free']);
    expect(store.getState().refresh).not.toHaveBeenCalled();
  });

  it('asks the backend once when nothing is known yet, and reads as free until it answers', async () => {
    const store = premiumStore({ hasChecked: false });

    expect(await render(store)).toEqual(['free']);
    expect(store.getState().refresh).toHaveBeenCalledTimes(1);
  });
});
