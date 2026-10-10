import type { MealSlotWireType } from '@infrastructure/diary/dtos/meal-slot-wire-dto';

// Body of `POST /me/meal-plan/entries`.
export interface CreateMealPlanEntryRequestDto {
  date: string;
  meal: MealSlotWireType;
  recipeId: string;
  servings: number;
}
