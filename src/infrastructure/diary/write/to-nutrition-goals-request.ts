import type { RequestMapper } from '@core/mapper/request-mapper';
import type { NutritionGoals } from '@domain/diary/nutrition/nutrition-goals';
import type { NutritionGoalsDto } from '@infrastructure/diary/dtos/nutrition-goals-dto';

/** `NutritionGoals` → `PUT /diary/goals` body. */
export const toNutritionGoalsRequest: RequestMapper<NutritionGoals, NutritionGoalsDto> = (goals) => ({
  calories: goals.calories,
  protein: goals.protein,
  carbs: goals.carbs,
  fat: goals.fat,
  fiber: goals.fiber,
  waterGlasses: goals.waterGlasses,
});
