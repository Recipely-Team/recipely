import type { TimerEntry } from '@application/timers/timer-entry';

/**
 * Ids of the timers that must yield when a recipe starts (or resumes) one.
 *
 * A recipe's prep and cook times are consecutive phases of the same dish, so
 * counting both down at once describes a kitchen that cannot exist — you are
 * either prepping or cooking. One timer per recipe is therefore the rule, and
 * starting the other phase replaces the one already running.
 *
 * Paused timers count as conflicts too: leaving one parked would let a later
 * resume put the recipe back into the two-timers state this rule forbids.
 * The scope is deliberately ONE recipe — timers on different recipes are
 * genuinely concurrent (a soup simmering while another dough rests).
 */
export const conflictingTimerIds = (
  timers: Record<string, TimerEntry>,
  recipeId: string,
  startingTimerId: string,
): string[] =>
  Object.values(timers)
    .filter((entry) => entry.recipeId === recipeId && entry.id !== startingTimerId)
    .map((entry) => entry.id);
