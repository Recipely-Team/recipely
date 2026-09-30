import type { Mapper } from '@core/mapper/mapper';
import type { ValidationFailure } from '@core/failure';
import { NutritionGoals } from '@domain/diary/nutrition/nutrition-goals';
import type { NutritionGoalsDto } from '@infrastructure/diary/dtos/nutrition-goals-dto';

/** Goals DTO → `NutritionGoals`; a missing `fiber` (older backend) takes the default. */
export const toNutritionGoals: Mapper<NutritionGoalsDto, NutritionGoals, ValidationFailure> = (dto) =>
  NutritionGoals.create({
    calories: dto.calories,
    protein: dto.protein,
    carbs: dto.carbs,
    fat: dto.fat,
    fiber: dto.fiber ?? NutritionGoals.defaults().fiber,
    waterGlasses: dto.waterGlasses,
  });
