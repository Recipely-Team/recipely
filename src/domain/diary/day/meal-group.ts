import type { FoodLogEntryEntity } from '@domain/diary/food-log-entry-entity';
import type { MealSlotType } from '@domain/diary/meal-slot';
import type { Nutrients } from '@domain/diary/nutrition/nutrients';

/** One meal card of a day: its entries in logged order and their sum. */
export interface MealGroup {
  readonly meal: MealSlotType;
  readonly entries: readonly FoodLogEntryEntity[];
  readonly totals: Nutrients;
}
