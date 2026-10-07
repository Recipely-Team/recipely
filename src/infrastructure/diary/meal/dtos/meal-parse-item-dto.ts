import type { KcalNutrientsDto } from '@infrastructure/diary/foods/dtos/kcal-nutrients-dto';

// One candidate of `POST /diary/meal-parse`. `match.id` is a foodVariantId for
// kind `food`; `nutrientsPerPortion` is for `grams`.
export interface MealParseItemDto {
  label: string;
  grams: number;
  match: { kind: string; id?: string; name?: string };
  nutrientsPerPortion: KcalNutrientsDto;
  estimated: boolean;
  confidence: number;
}
