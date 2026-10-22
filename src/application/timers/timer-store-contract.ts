import type { TimerEntry } from '@application/timers/timer-entry';

export interface TimerStore {
  timers: Record<string, TimerEntry>;
  /** True once hydrate() has resolved — avoids flash of empty state. */
  hydrated: boolean;
  hydrate: () => Promise<void>;
  add: (entry: TimerEntry) => Promise<void>;
  remove: (id: string) => Promise<void>;
  pause: (id: string) => Promise<void>;
  /** `newEndTimeMs` = Date.now() + remainingMsOnPause when resuming. */
  resume: (id: string, newEndTimeMs: number) => Promise<void>;
}
