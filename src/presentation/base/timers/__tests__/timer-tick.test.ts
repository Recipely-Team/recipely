/**
 * The shared countdown clock. Reported from iOS: the app stuttered once
 * several timers were running, because every timer used to own a `setInterval`
 * — N unsynchronised wake-ups and N React commits per second. These tests pin
 * the properties that fix costs at ONE interval and ONE notification round no
 * matter how many timers are counting down.
 */

import { getTickNowMs, subscribeToTick } from '@presentation/base/timers/timer-tick';

describe('timer-tick', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  it('runs a single interval no matter how many timers subscribe', () => {
    const intervalSpy = jest.spyOn(global, 'setInterval');

    const unsubscribes = [jest.fn(), jest.fn(), jest.fn(), jest.fn()].map((listener) =>
      subscribeToTick(listener),
    );

    expect(intervalSpy).toHaveBeenCalledTimes(1);
    unsubscribes.forEach((unsubscribe) => {
      unsubscribe();
    });
    intervalSpy.mockRestore();
  });

  it('notifies every subscriber in the same tick', () => {
    const first = jest.fn();
    const second = jest.fn();
    const unsubscribeFirst = subscribeToTick(first);
    const unsubscribeSecond = subscribeToTick(second);

    jest.advanceTimersByTime(1000);

    expect(first).toHaveBeenCalledTimes(1);
    expect(second).toHaveBeenCalledTimes(1);
    unsubscribeFirst();
    unsubscribeSecond();
  });

  it('advances the snapshot on each tick', () => {
    const unsubscribe = subscribeToTick(jest.fn());
    const before = getTickNowMs();

    jest.advanceTimersByTime(2000);

    expect(getTickNowMs()).toBeGreaterThan(before);
    unsubscribe();
  });

  it('stops ticking once the last subscriber leaves', () => {
    const listener = jest.fn();
    const unsubscribe = subscribeToTick(listener);

    unsubscribe();
    jest.advanceTimersByTime(5000);

    expect(listener).not.toHaveBeenCalled();
    expect(jest.getTimerCount()).toBe(0);
  });

  it('keeps ticking for the remaining subscribers when one leaves', () => {
    const staying = jest.fn();
    const leaving = jest.fn();
    const unsubscribeStaying = subscribeToTick(staying);
    const unsubscribeLeaving = subscribeToTick(leaving);

    unsubscribeLeaving();
    jest.advanceTimersByTime(1000);

    expect(staying).toHaveBeenCalledTimes(1);
    expect(leaving).not.toHaveBeenCalled();
    unsubscribeStaying();
  });
});
