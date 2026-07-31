import { create } from 'zustand';
import { TIMERS_STORAGE_KEY } from '@infrastructure/constants/storage';
import { getKeyValueStore } from '@application/storage/get-key-value-store';
import type { TimerEntry } from '@application/timers/timer-entry';
import type { TimerStoreState } from '@application/timers/timer-store-state';
import { ValueConstants } from '@core/constants';

const persist = async (timers: Record<string, TimerEntry>): Promise<void> => {
  await getKeyValueStore().setItem(TIMERS_STORAGE_KEY, JSON.stringify(timers));
};

export const timerStore = create<TimerStoreState>((set, get) => ({
  timers: {},
  hydrated: false,

  hydrate: async () => {
    const read = await getKeyValueStore().getItem(TIMERS_STORAGE_KEY);
    const raw = read.ok ? read.value : null;
    if (!raw) {
      set({ hydrated: true });
      return;
    }
    try {
      const stored = JSON.parse(raw) as Record<string, TimerEntry>;
      // Keep ALL entries including expired ones. Expired timers are detected by
      // useTimerNotificationSync which triggers the alarm then removes them.
      set({ timers: stored, hydrated: true });
    } catch {
      set({ hydrated: true });
    }
  },

  add: async (entry) => {
    const timers = { ...get().timers, [entry.id]: entry };
    set({ timers });
    await persist(timers);
  },

  remove: async (id) => {
    const timers = { ...get().timers };
    delete timers[id];
    set({ timers });
    await persist(timers);
  },

  pause: async (id) => {
    const entry = get().timers[id];
    if (!entry || entry.isPaused) return;
    const remainingMsOnPause = Math.max(ValueConstants.zero, entry.endTimeMs - Date.now());
    const updated: TimerEntry = { ...entry, isPaused: true, remainingMsOnPause };
    const timers = { ...get().timers, [id]: updated };
    set({ timers });
    await persist(timers);
  },

  resume: async (id, newEndTimeMs) => {
    const entry = get().timers[id];
    if (!entry || !entry.isPaused) return;
    const updated: TimerEntry = { ...entry, isPaused: false, endTimeMs: newEndTimeMs };
    const timers = { ...get().timers, [id]: updated };
    set({ timers });
    await persist(timers);
  },
}));
