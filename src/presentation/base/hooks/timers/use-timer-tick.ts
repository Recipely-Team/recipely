import { useSyncExternalStore } from 'react';
import { getTickNowMs, subscribeToTick } from '@presentation/base/timers/timer-tick';
import { ValueConstants } from '@core/constants';

// Both are module-level so their identity is stable across renders: a new
// `subscribe` identity would make useSyncExternalStore re-subscribe on every
// render, which is exactly the churn this hook exists to remove.
const noopSubscribe = (): (() => void) => (): void => undefined;
const frozenNowMs = (): number => ValueConstants.zero;

/**
 * Current epoch milliseconds, re-rendering the caller once a second while
 * `running` is true.
 *
 * A paused, finished or unstarted timer displays a value that cannot change on
 * its own, so it does not subscribe at all and costs nothing per second. The
 * returned value is meaningless when `running` is false — read it only on the
 * branch that is actually counting down.
 */
export const useTimerTick = (running: boolean): number =>
  useSyncExternalStore(
    running ? subscribeToTick : noopSubscribe,
    running ? getTickNowMs : frozenNowMs,
    frozenNowMs,
  );
