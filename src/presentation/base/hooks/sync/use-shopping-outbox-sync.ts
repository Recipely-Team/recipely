import type { StoreApi } from 'zustand/vanilla';
import { useEffect } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { AppStateStatusValue } from '@infrastructure/constants/app-state-status';
import { StoreStatus } from '@application/store/store-status';
import type { AuthStore } from '@application/auth/auth-store-contract';
import type { ShoppingListStore } from '@application/shopping/shopping-list-store-contract';

/** While changes wait, how often a foreground app tries the API again. An empty outbox costs one storage read. */
const RETRY_INTERVAL_MS = 60_000;

/**
 * Sends the shopping-list ticks and deletes made offline (the store's `syncPending`) on launch,
 * on every return to the foreground, and once a minute while the app is open — the signal is
 * usually back by the time the user leaves the shop, not while the list screen is open.
 * Signed out, it does nothing: the outbox was cleared with the session.
 */
export const useShoppingOutboxSync = (shoppingListStore: StoreApi<ShoppingListStore>, authStore: StoreApi<AuthStore>): void => {
  useEffect(() => {
    const tick = (): void => {
      if (authStore.getState().state.status !== StoreStatus.Authenticated) return;
      void shoppingListStore.getState().syncPending();
    };
    const pollTick = (): void => {
      if (AppState.currentState === AppStateStatusValue.active) tick();
    };

    tick();
    const interval = setInterval(pollTick, RETRY_INTERVAL_MS);
    const subscription = AppState.addEventListener('change', (next: AppStateStatus) => {
      if (next === AppStateStatusValue.active) tick();
    });

    return () => {
      clearInterval(interval);
      subscription.remove();
    };
  }, [shoppingListStore, authStore]);
};
