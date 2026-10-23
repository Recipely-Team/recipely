import { createStore } from 'zustand/vanilla';
import type { AlarmStore } from '@application/timers/alarm-store-contract';

export const alarmStore = createStore<AlarmStore>((set) => ({
  alarms: [],
  trigger: (timerId, recipeName) =>
    set((state) => {
      if (state.alarms.some((alarm) => alarm.timerId === timerId)) return state;
      return { alarms: [...state.alarms, { timerId, recipeName }] };
    }),
  dismiss: (timerId) =>
    set((state) => ({ alarms: state.alarms.filter((alarm) => alarm.timerId !== timerId) })),
}));
