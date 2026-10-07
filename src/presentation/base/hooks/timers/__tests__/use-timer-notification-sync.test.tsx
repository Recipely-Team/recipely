/* eslint-disable import/first -- jest.mock() must be hoisted above imports */
jest.mock('expo-notifications', () => ({
  addNotificationResponseReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
  getLastNotificationResponseAsync: jest.fn(() => Promise.resolve(null)),
}));

import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { timerStore } from '@application/timers/timer-store';
import type { TimerEntry } from '@application/timers/timer-entry';
import { useTimerNotificationSync } from '@presentation/base/hooks/timers/use-timer-notification-sync';

/**
 * **Render storm's quiet cousin: the one-second clock never stopped.** The root-mounted sync
 * subscribed to the shared tick for the app's whole lifetime, so its `setInterval` woke the JS
 * thread every second even with no timer anywhere. It now listens only while a timer runs.
 */
const MINUTE_MS = 60_000;

const entryOf = (isPaused: boolean): TimerEntry => ({
  id: 'r1:cook',
  recipeId: 'r1',
  recipeName: 'Soup',
  durationSeconds: 600,
  endTimeMs: Date.now() + 10 * MINUTE_MS,
  isPaused,
  remainingMsOnPause: isPaused ? 10 * MINUTE_MS : 0,
  completionNotifIds: [],
});

const Probe = (): null => {
  useTimerNotificationSync();
  return null;
};

describe('useTimerNotificationSync — the one-second clock', () => {
  let renderer: ReactTestRenderer | null = null;

  beforeEach(() => {
    jest.useFakeTimers();
    timerStore.setState({ timers: {} });
  });

  afterEach(() => {
    act(() => renderer?.unmount());
    renderer = null;
    timerStore.setState({ timers: {} });
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  it('runs no interval while no timer is running', () => {
    act(() => {
      renderer = create(<Probe />);
    });

    expect(jest.getTimerCount()).toBe(0);
  });

  it('ticks while a timer runs and stops once it is paused or gone', () => {
    act(() => {
      renderer = create(<Probe />);
    });

    act(() => timerStore.setState({ timers: { 'r1:cook': entryOf(false) } }));
    expect(jest.getTimerCount()).toBe(1);

    act(() => timerStore.setState({ timers: { 'r1:cook': entryOf(true) } }));
    expect(jest.getTimerCount()).toBe(0);

    act(() => timerStore.setState({ timers: { 'r1:cook': entryOf(false) } }));
    act(() => timerStore.setState({ timers: {} }));
    expect(jest.getTimerCount()).toBe(0);
  });

  it('detaches from the clock when unmounted', () => {
    timerStore.setState({ timers: { 'r1:cook': entryOf(false) } });
    act(() => {
      renderer = create(<Probe />);
    });
    expect(jest.getTimerCount()).toBe(1);

    act(() => renderer?.unmount());
    renderer = null;

    expect(jest.getTimerCount()).toBe(0);
  });
});
