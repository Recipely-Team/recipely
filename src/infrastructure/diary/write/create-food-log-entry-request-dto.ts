import type { MealSlotWireType } from '@infrastructure/diary/dtos/meal-slot-wire-dto';

// Body of `POST /diary/entries`. Nutrients are for the whole logged amount;
// a macro the food never reported travels as `null`.
export interface CreateFoodLogEntryRequestDto {
  date: string;
  meal: MealSlotWireType;
  name: string;
  servings: number;
  calories: number;
  protein: number | null;
  carbs: number | null;
  fat: number | null;
  fiber: number | null;
  recipeId: string | null;
}
