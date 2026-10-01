import type { Mapper } from '@core/mapper/mapper';
import type { ValidationFailure } from '@core/failure';
import type { Nutrients } from '@domain/diary/nutrition/nutrients';
import type { KcalNutrientsDto } from '@infrastructure/diary/foods/dtos/kcal-nutrients-dto';
import { toNutrients } from '@infrastructure/diary/read/to-nutrients';

/** The foods endpoints' `{ kcal, … }` figures (`per100`, `perUnit`) → `Nutrients`. */
export const toKcalNutrients: Mapper<KcalNutrientsDto, Nutrients, ValidationFailure> = (dto) =>
  toNutrients({ calories: dto.kcal, protein: dto.protein, carbs: dto.carbs, fat: dto.fat, fiber: dto.fiber });
