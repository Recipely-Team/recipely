import type { Mapper } from '@core/mapper/mapper';
import type { ValidationFailure } from '@core/failure';
import { Nutrients } from '@domain/diary/nutrition/nutrients';

/**
 * The nutrient fields every diary DTO shares. A field the wire omits (the
 * month rows carry no fiber) or sends as `null` is "not reported".
 */
interface NutrientFieldsDto {
  calories: number;
  protein?: number | null;
  carbs?: number | null;
  fat?: number | null;
  fiber?: number | null;
}

export const toNutrients: Mapper<NutrientFieldsDto, Nutrients, ValidationFailure> = (dto) =>
  Nutrients.create({
    calories: dto.calories,
    protein: dto.protein ?? null,
    carbs: dto.carbs ?? null,
    fat: dto.fat ?? null,
    fiber: dto.fiber ?? null,
  });
