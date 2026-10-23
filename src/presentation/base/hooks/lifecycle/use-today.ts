import { useSyncExternalStore } from 'react';
import { AppState } from 'react-native';
import { CalendarDate } from '@domain/diary/calendar/calendar-date';
import { ValueConstants } from '@core/constants';

/** The day last read; the same object until the date actually changes, as useSyncExternalStore requires. */
let today = CalendarDate.today();

const readToday = (): CalendarDate => {
  const now = CalendarDate.today();
  if (now.value !== today.value) today = now;
  return today;
};

/** Milliseconds from `now` to the next local midnight. */
const untilMidnight = (now: Date): number => {
  const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + ValueConstants.one);
  return midnight.getTime() - now.getTime();
};

const subscribe = (onChange: () => void): (() => void) => {
  let timer: ReturnType<typeof setTimeout> | null = null;
  const arm = (): void => {
    timer = setTimeout(() => {
      onChange();
      arm();
    }, untilMidnight(new Date()));
  };
  arm();
  // A phone asleep across midnight does not run timers; coming back re-reads the date.
  const foreground = AppState.addEventListener('change', onChange);
  return () => {
    if (timer !== null) clearTimeout(timer);
    foreground.remove();
  };
};

/**
 * Today's date, as state.
 *
 * @remarks
 * - **The date is outside React, so it is subscribed to.** Read with
 *   `CalendarDate.today()` during render, it is a value the React Compiler
 *   caches with the component: a diary left open overnight kept calling
 *   yesterday "Today". This re-renders its readers at local midnight and when
 *   the app returns to the foreground, and never otherwise.
 */
export const useToday = (): CalendarDate => useSyncExternalStore(subscribe, readToday, readToday);
