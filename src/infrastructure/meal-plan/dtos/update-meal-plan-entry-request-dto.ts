import type { MealSlotWireType } from '@infrastructure/diary/dtos/meal-slot-wire-dto';

// Body of `PATCH /me/meal-plan/entries/:id`; only the fields that change are sent.
export interface UpdateMealPlanEntryRequestDto {
  date?: string;
  meal?: MealSlotWireType;
  servings?: number;
  position?: number;
}
