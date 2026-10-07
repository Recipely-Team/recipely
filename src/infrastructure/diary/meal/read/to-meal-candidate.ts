import type { Mapper } from '@core/mapper/mapper';
import type { ValidationFailure } from '@core/failure';
import { MealCandidate } from '@domain/diary/meal/meal-candidate';
import { MealMatchKind, type MealMatchKindType } from '@domain/diary/meal/meal-match-kind';
import type { MealParseItemDto } from '@infrastructure/diary/meal/dtos/meal-parse-item-dto';
import { toKcalNutrients } from '@infrastructure/diary/foods/read/to-kcal-nutrients';

const toKind = (wire: string): MealMatchKindType =>
  Object.values(MealMatchKind).find((kind) => kind === wire) ?? MealMatchKind.None;

/**
 * One wire candidate → `MealCandidate`. An unknown match kind reads as no
 * match; a kind without an id keeps its kind but cannot be referenced, so it
 * logs as a quick add.
 */
export const toMealCandidate: Mapper<MealParseItemDto, MealCandidate, ValidationFailure> = (dto) => {
  const portion = toKcalNutrients(dto.nutrientsPerPortion);
  if (!portion.ok) return portion;
  return MealCandidate.create({
    label: dto.label,
    grams: dto.grams,
    portionGrams: dto.grams,
    portion: portion.value,
    match: { kind: toKind(dto.match.kind), id: dto.match.id ?? null, name: dto.match.name ?? null },
    estimated: dto.estimated,
    confidence: dto.confidence,
  });
};
