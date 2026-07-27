/**
 * One timer per recipe. Prep and cook are consecutive phases of the same dish,
 * so a running pair describes a kitchen that cannot exist; timers on different
 * recipes are genuinely concurrent and must be left alone.
 */

import { conflictingTimerIds } from '@application/timers/conflicting-timer-ids';
import type { TimerEntry } from '@application/timers/timer-entry';

const makeEntry = (id: string, recipeId: string, isPaused = false): TimerEntry => ({
  id,
  recipeId,
  recipeName: 'Pasta',
  durationSeconds: 300,
  endTimeMs: Date.now() + 300_000,
  isPaused,
  remainingMsOnPause: 0,
  completionNotifIds: [],
});

const timersOf = (...entries: TimerEntry[]): Record<string, TimerEntry> =>
  Object.fromEntries(entries.map((entry) => [entry.id, entry]));

describe('conflictingTimerIds', () => {
  it('reports the recipe’s other timer', () => {
    const timers = timersOf(makeEntry('r1:prep', 'r1'));

    expect(conflictingTimerIds(timers, 'r1', 'r1:cook')).toEqual(['r1:prep']);
  });

  it('never reports the timer that is starting', () => {
    const timers = timersOf(makeEntry('r1:cook', 'r1'));

    expect(conflictingTimerIds(timers, 'r1', 'r1:cook')).toEqual([]);
  });

  it('reports a paused timer, which a later resume would otherwise revive', () => {
    const timers = timersOf(makeEntry('r1:prep', 'r1', true));

    expect(conflictingTimerIds(timers, 'r1', 'r1:cook')).toEqual(['r1:prep']);
  });

  it('leaves other recipes alone', () => {
    const timers = timersOf(makeEntry('r2:cook', 'r2'), makeEntry('r3:prep', 'r3'));

    expect(conflictingTimerIds(timers, 'r1', 'r1:cook')).toEqual([]);
  });

  it('reports every stale timer when a recipe somehow holds more than one', () => {
    const timers = timersOf(makeEntry('r1:prep', 'r1'), makeEntry('r1:step1', 'r1'));

    expect(conflictingTimerIds(timers, 'r1', 'r1:cook').sort()).toEqual(['r1:prep', 'r1:step1']);
  });
});
