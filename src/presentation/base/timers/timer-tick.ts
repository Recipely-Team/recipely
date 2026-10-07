import { ValueConstants } from '@core/constants';
import { TimerTimeConstants } from '@presentation/base/timers/timer-time-constants';

type TickListener = () => void;

const listeners = new Set<TickListener>();

let handle: ReturnType<typeof setInterval> | null = null;
let nowMs = Date.now();

const publish = (): void => {
  nowMs = Date.now();
  // Snapshot and isolate listeners: one throwing must not stop the rest.
  for (const listener of [...listeners]) {
    try {
      listener();
    } catch {
      // A broken subscriber is its own problem, not the clock's.
    }
  }
};

/**
 * Subscribes to the app's single one-second countdown clock; returns the
 * unsubscribe function.
 *
 * Every running timer reads THIS interval instead of starting its own. One
 * `setInterval` per timer meant N unsynchronised wake-ups and N separate React
 * commits every second — the stutter reported once several timers were running
 * at the same time. Here one callback notifies every listener, so React batches
 * them into a single commit, and the cost stops scaling with the timer count.
 *
 * The interval itself runs only while something is subscribed: the countdowns
 * on screen, and `useTimerNotificationSync` while at least one timer is
 * running. With no timer running, nothing wakes the JS thread.
 */
export const subscribeToTick = (listener: TickListener): (() => void) => {
  nowMs = Date.now();
  listeners.add(listener);
  if (handle === null) {
    handle = setInterval(publish, TimerTimeConstants.tickIntervalMs);
  }

  return () => {
    listeners.delete(listener);
    if (listeners.size === ValueConstants.zero && handle !== null) {
      clearInterval(handle);
      handle = null;
    }
  };
};

/** Epoch milliseconds as of the last tick — the external-store snapshot. */
export const getTickNowMs = (): number => nowMs;
