import { CalendarDate } from '@domain/diary/calendar/calendar-date';
import { MealSlot } from '@domain/diary/meal-slot';
import { MealCandidate } from '@domain/diary/meal/meal-candidate';
import { MealMatchKind } from '@domain/diary/meal/meal-match-kind';
import { nutrientsOf } from '@domain/diary/__fixtures__/nutrients-of';
import { mealCandidateOf } from '@domain/diary/__fixtures__/meal-candidate-of';

const date = CalendarDate.of(2026, 10, 7);

describe('MealCandidate', () => {
  it('rescales every nutrient linearly from the parser portion when the grams change', () => {
    const doubled = mealCandidateOf().withGrams(300);
    expect(doubled.grams).toBe(300);
    expect(doubled.nutrients.value).toEqual({ calories: 400, protein: 24, carbs: 12, fat: 28, fiber: 4 });
    // Back down from an edit: still scaled from the original portion, not compounded.
    expect(doubled.withGrams(75).nutrients.calories).toBe(100);
  });

  it('keeps an unknown macro unknown when rescaling', () => {
    const c = mealCandidateOf({ grams: 100, portionGrams: 100, portion: nutrientsOf({ calories: 100 }) }).withGrams(50);
    expect(c.nutrients.value).toEqual({ calories: 50, protein: null, carbs: null, fat: null, fiber: null });
  });

  it('clamps edited grams to whole grams within 1..5000, and ignores a non-number', () => {
    const c = mealCandidateOf();
    expect(c.withGrams(0).grams).toBe(1);
    expect(c.withGrams(99999).grams).toBe(5000);
    expect(c.withGrams(12.6).grams).toBe(13);
    expect(c.withGrams(Number.NaN)).toBe(c);
  });

  it('refuses an item without a label or a positive amount', () => {
    const base = { grams: 100, portionGrams: 100, portion: nutrientsOf({ calories: 1 }), match: { kind: MealMatchKind.None, id: null, name: null }, estimated: true, confidence: 2 };
    expect(MealCandidate.create({ ...base, label: '  ' }).ok).toBe(false);
    expect(MealCandidate.create({ ...base, label: 'Tea', grams: 0 }).ok).toBe(false);
    const ok = MealCandidate.create({ ...base, label: ' Tea ' });
    expect(ok.ok && [ok.value.label, ok.value.confidence]).toEqual(['Tea', 1]);
  });

  it('logs a catalogue food as a product counted in grams of its variant', () => {
    const entry = mealCandidateOf().withGrams(200).entryFor(date, MealSlot.Lunch);
    expect(entry.servings).toBe(200);
    expect(entry.recipeId).toBeNull();
    expect(entry.product).toEqual({ source: 'curated', foodVariantId: 'v1', offBarcode: null, unitKey: 'g', unitAmount: 1 });
    expect(entry.nutrients.calories).toBeCloseTo(266.67, 1);
  });

  it('logs an unmatched or recipe-matched item as one serving of a quick add with its own figures', () => {
    for (const match of [{ kind: MealMatchKind.None, id: null, name: null }, { kind: MealMatchKind.Recipe, id: 'r1', name: 'Soup' }]) {
      const entry = mealCandidateOf({ label: 'Ayran', match, estimated: true }).entryFor(date, MealSlot.Dinner);
      expect([entry.name, entry.servings, entry.product, entry.recipeId, entry.nutrients.calories]).toEqual(['Ayran', 1, null, null, 200]);
    }
  });
});
