import type { CalendarDate } from '@domain/diary/calendar/calendar-date';
import type { FoodLogEntryEntity } from '@domain/diary/food-log-entry-entity';
import type { NutritionGoals } from '@domain/diary/nutrition/nutrition-goals';

export interface DiaryDayProps {
  readonly date: CalendarDate;
  readonly entries: readonly FoodLogEntryEntity[];
  readonly waterGlasses: number;
  readonly goals: NutritionGoals;
}
