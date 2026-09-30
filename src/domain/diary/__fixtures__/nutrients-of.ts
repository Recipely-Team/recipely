import { Nutrients } from '@domain/diary/nutrition/nutrients';
import type { NutrientValues } from '@domain/diary/nutrition/nutrient-values';

/** Valid `Nutrients` for a test; macros default to unknown. */
export const nutrientsOf = (values: Partial<NutrientValues> & { calories: number }): Nutrients => {
  const created = Nutrients.create({ protein: null, carbs: null, fat: null, fiber: null, ...values });
  if (!created.ok) throw new Error(created.failure.message);
  return created.value;
};
