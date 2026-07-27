import { create } from 'zustand';
import { getKeyValueStore } from '@application/storage/get-key-value-store';
import { TIMERS_BAR_COLLAPSED_STORAGE_KEY } from '@infrastructure/constants/storage';
import type { TimersBarStoreState } from '@presentation/base/timers/timers-bar-store-state';

const COLLAPSED = 'true';

/**
 * Whether the docked timers bar is collapsed to its corner pill.
 *
 * A view preference rather than timer state, so it is deliberately NOT part of
 * `timerStore`. It is persisted because the bar is pinned over the content:
 * a user who parked it to reach what it covers should not find it back on top
 * of that content after the next launch. Persistence is best-effort — the bar
 * still collapses when the keychain refuses, and a rejected write reaching a
 * touch handler as an unhandled rejection would be worse than a forgotten
 * preference.
 */
export const timersBarStore = create<TimersBarStoreState>((set, get) => ({
  collapsed: false,
  chosen: false,

  hydrate: async () => {
    let stored: string | null = null;
    try {
      stored = await getKeyValueStore().getItem(TIMERS_BAR_COLLAPSED_STORAGE_KEY);
    } catch {
      return;
    }
    // The stored value is only a default. On a cold start this read races the
    // (equally slow) timer read that makes the bar appear at all, so it must
    // never overwrite a choice the user has already made on screen — that
    // would pop the bar back open over the content they just uncovered.
    if (get().chosen) return;
    set({ collapsed: stored === COLLAPSED });
  },

  setCollapsed: async (collapsed) => {
    set({ collapsed, chosen: true });
    try {
      const store = getKeyValueStore();
      await (collapsed
        ? store.setItem(TIMERS_BAR_COLLAPSED_STORAGE_KEY, COLLAPSED)
        : store.removeItem(TIMERS_BAR_COLLAPSED_STORAGE_KEY));
    } catch {
      // Best-effort persistence: the bar is already collapsed on screen.
    }
  },
}));
