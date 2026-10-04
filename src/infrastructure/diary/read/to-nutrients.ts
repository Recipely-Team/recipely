import type { Mapper } from '@core/mapper/mapper';
import type { ValidationFailure } from '@core/failure';
import { Nutrients } from '@domain/diary/nutrition/nutrients';
import type { NutrientFieldsDto } from '@infrastructure/diary/dtos/nutrient-fields-dto';

/** The nutrient fields every diary DTO shares → `Nutrients`; an omitted or `null` field is "not reported". */
export const toNutrients: Mapper<NutrientFieldsDto, Nutrients, ValidationFailure> = (dto) =>
  Nutrients.create({
    calories: dto.calories,
    protein: dto.protein ?? null,
    carbs: dto.carbs ?? null,
    fat: dto.fat ?? null,
    fiber: dto.fiber ?? null,
  });
