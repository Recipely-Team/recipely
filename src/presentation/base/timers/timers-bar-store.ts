import { create } from 'zustand';
import { getKeyValueStore } from '@application/storage/get-key-value-store';
import { TIMERS_BAR_COLLAPSED_STORAGE_KEY } from '@infrastructure/constants/storage';
import type { TimersBarStoreState } from '@presentation/base/timers/timers-bar-store-state';
import { CharConstants } from '@core/constants';

const COLLAPSED = 'true';

/**
 * Whether the docked timers bar is collapsed to its corner pill.
 *
 * A view preference rather than timer state, so it is deliberately NOT part of
 * `timerStore`. It is persisted because the bar is pinned over the content:
 * a user who parked it to reach what it covers should not find it back on top
 * of that content after the next launch.
 */
export const timersBarStore = create<TimersBarStoreState>((set) => ({
  collapsed: false,

  hydrate: async () => {
    const stored = await getKeyValueStore().getItem(TIMERS_BAR_COLLAPSED_STORAGE_KEY);
    set({ collapsed: stored === COLLAPSED });
  },

  setCollapsed: async (collapsed) => {
    set({ collapsed });
    await getKeyValueStore().setItem(
      TIMERS_BAR_COLLAPSED_STORAGE_KEY,
      collapsed ? COLLAPSED : CharConstants.empty,
    );
  },
}));
