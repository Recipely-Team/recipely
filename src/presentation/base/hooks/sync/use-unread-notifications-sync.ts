import type { BoundStore } from '@application/store/bound-store';
import { AppStateStatusValue } from '@infrastructure/constants/app-state-status';
import { StoreStatus } from '@application/store/store-status';
import { useEffect } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import type { AuthStoreState } from '@application/auth/auth-store-state';
import type { NotificationsStoreState } from '@application/notifications/notifications-store-state';

// How often to re-poll the unread count while the app is in the foreground.
// System pushes (Android/web) alert the user, but nothing feeds them back into
// this in-app badge — the poll is the badge's freshness source on every
// platform, so it stays reasonably tight. Each tick requests limit=1, so the
// cost per poll is minimal.
const POLL_INTERVAL_MS = 30_000;

/**
 * Keeps the notification bell badge fresh app-wide: refreshes the unread count
 * on mount, whenever the app returns to the foreground, and on a slow interval.
 * No-ops while the user is signed out so we never poll an unauthenticated API.
 *
 * @remarks
 * **The interval polls only a foreground app.** It used to fire every 30 s
 * whatever the app state, so a backgrounded app (or a hidden browser tab) kept
 * asking for a badge nobody could see. A tick now checks
 * `AppState.currentState` — which react-native-web derives from
 * `document.visibilityState` — and the return to `active` catches up at once.
 */
export const useUnreadNotificationsSync = (
  notificationsStore: BoundStore<NotificationsStoreState>,
  authStore: BoundStore<AuthStoreState>,
): void => {
  useEffect(() => {
    const tick = (): void => {
      if (authStore.getState().state.status !== StoreStatus.Authenticated) return;
      void notificationsStore.getState().refreshUnread();
    };
    const pollTick = (): void => {
      if (AppState.currentState === AppStateStatusValue.active) tick();
    };

    tick();
    const interval = setInterval(pollTick, POLL_INTERVAL_MS);
    const subscription = AppState.addEventListener('change', (next: AppStateStatus) => {
      if (next === AppStateStatusValue.active) tick();
    });

    return () => {
      clearInterval(interval);
      subscription.remove();
    };
  }, [notificationsStore, authStore]);
};
