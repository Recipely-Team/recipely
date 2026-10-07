import { MealCandidate } from '@domain/diary/meal/meal-candidate';
import type { MealCandidateProps } from '@domain/diary/meal/meal-candidate-props';
import { MealMatchKind } from '@domain/diary/meal/meal-match-kind';
import { nutrientsOf } from '@domain/diary/__fixtures__/nutrients-of';

/** A valid `MealCandidate` for a test: 150 g of a catalogue food at 200 kcal, unless overridden. */
export const mealCandidateOf = (overrides: Partial<MealCandidateProps> = {}): MealCandidate => {
  const created = MealCandidate.create({
    label: 'Menemen',
    grams: 150,
    portionGrams: 150,
    portion: nutrientsOf({ calories: 200, protein: 12, carbs: 6, fat: 14, fiber: 2 }),
    match: { kind: MealMatchKind.Food, id: 'v1', name: 'Menemen' },
    estimated: false,
    confidence: 0.9,
    ...overrides,
  });
  if (!created.ok) throw new Error(created.failure.message);
  return created.value;
};
