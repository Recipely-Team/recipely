import type { Mapper } from '@core/mapper/mapper';
import type { ValidationFailure } from '@core/failure';
import type { Nutrients } from '@domain/diary/nutrition/nutrients';
import type { PerHundredDto } from '@infrastructure/diary/foods/dtos/per-hundred-dto';
import { toNutrients } from '@infrastructure/diary/read/to-nutrients';

/** A product's per-100 figures (`kcal`, …) → `Nutrients`. */
export const toPerHundred: Mapper<PerHundredDto, Nutrients, ValidationFailure> = (dto) =>
  toNutrients({ calories: dto.kcal, protein: dto.protein, carbs: dto.carbs, fat: dto.fat, fiber: dto.fiber });
