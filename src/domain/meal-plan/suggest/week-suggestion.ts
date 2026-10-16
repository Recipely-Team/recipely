import type { CalendarDate } from '@domain/diary/calendar/calendar-date';
import type { SuggestedSlot } from '@domain/meal-plan/suggest/suggested-slot';

/**
 * "Plan my week": a draft drawn from the user's saved, liked and own recipes,
 * written nowhere until they add it (recipely-backend #419).
 */
export interface WeekSuggestion {
  readonly weekStart: CalendarDate;
  readonly slots: readonly SuggestedSlot[];
  /** How many recipes the draft could choose from; 0 means "save some first". */
  readonly poolSize: number;
}
