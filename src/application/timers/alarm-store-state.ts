import type { AlarmEntry } from '@application/timers/alarm-entry';

export interface AlarmStoreState {
  /**
   * Every timer whose alarm is ringing, oldest first. A queue rather than one
   * entry: two timers can finish within seconds of each other, and the second
   * one used to overwrite the first — whose "already alarmed" mark then kept it
   * from ever coming back, so it could not be dismissed at all.
   */
  alarms: readonly AlarmEntry[];
  /** Queues a timer's alarm. No-op if that timer is already in the queue. */
  trigger: (timerId: string, recipeName: string) => void;
  /** Removes one timer's alarm; the next queued one takes the screen. */
  dismiss: (timerId: string) => void;
}
