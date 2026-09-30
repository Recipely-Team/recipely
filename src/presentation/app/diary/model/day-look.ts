import type { CalorieStatusType } from '@domain/diary/nutrition/calorie-status';

/** What a date cell shows of a day: its kcal and how they compare with the goal. */
export interface DayLook {
  calories: number;
  status: CalorieStatusType;
}
