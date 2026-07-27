const ids = new Set<string>();

/**
 * Timers whose in-app alarm has already been raised this session.
 *
 * The one-second sweep re-checks every stored timer, so without this the same
 * expired timer would re-trigger the alarm on every tick. Ids are cleared when
 * a timer is started or stopped: they are deterministic (`<recipeId>:<slot>`),
 * so a set that only ever grew meant restarting the same prep timer never
 * alarmed a second time.
 */
export const triggeredAlarms = {
  has: (timerId: string): boolean => ids.has(timerId),
  mark: (timerId: string): void => {
    ids.add(timerId);
  },
  clear: (timerId: string): void => {
    ids.delete(timerId);
  },
};
