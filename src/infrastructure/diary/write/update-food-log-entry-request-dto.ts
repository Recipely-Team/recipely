import type { MealSlotWireType } from '@infrastructure/diary/dtos/meal-slot-wire-dto';

// Body of `PATCH /diary/entries/:id` — only the fields being changed.
export interface UpdateFoodLogEntryRequestDto {
  meal?: MealSlotWireType;
  servings?: number;
  date?: string;
}
