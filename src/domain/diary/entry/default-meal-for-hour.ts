import { MealSlot, type MealSlotType } from '@domain/diary/meal-slot';

const LUNCH_FROM = 11;
const DINNER_FROM = 16;
const SNACKS_FROM = 21;

/**
 * The meal a new entry defaults to, from the local hour (0–23): before 11
 * breakfast, before 16 lunch, before 21 dinner, otherwise snacks (design spec §3).
 */
export const defaultMealForHour = (hour: number): MealSlotType => {
  if (hour < LUNCH_FROM) return MealSlot.Breakfast;
  if (hour < DINNER_FROM) return MealSlot.Lunch;
  if (hour < SNACKS_FROM) return MealSlot.Dinner;
  return MealSlot.Snacks;
};
