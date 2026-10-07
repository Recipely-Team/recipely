import { MealMatchKind } from '@domain/diary/meal/meal-match-kind';
import { toMealParseResult } from '@infrastructure/diary/meal/read/to-meal-parse-result';
import type { MealParseItemDto } from '@infrastructure/diary/meal/dtos/meal-parse-item-dto';

const item = (overrides: Partial<MealParseItemDto> = {}): MealParseItemDto => ({
  label: 'ekmek',
  grams: 50,
  match: { kind: 'food', id: 'v9', name: 'Bread' },
  nutrientsPerPortion: { kcal: 130, protein: 4.5, carbs: 25, fat: 1, fiber: 1.5 },
  estimated: false,
  confidence: 0.8,
  ...overrides,
});

describe('toMealParseResult', () => {
  it('maps kcal to calories, the match, the estimate flag and the note', () => {
    const r = toMealParseResult({ items: [item(), item({ label: 'salça', match: { kind: 'none' }, estimated: true })], note: 'some_estimated' });
    if (!r.ok) throw new Error(r.failure.message);
    const [bread, paste] = r.value.items;
    expect([bread?.nutrients.calories, bread?.nutrients.protein, bread?.grams, bread?.isCatalogueFood]).toEqual([130, 4.5, 50, true]);
    expect(bread?.match).toEqual({ kind: MealMatchKind.Food, id: 'v9', name: 'Bread' });
    expect([paste?.estimated, paste?.isCatalogueFood, paste?.match.id]).toEqual([true, false, null]);
    expect(r.value.note).toBe('some_estimated');
  });

  it('skips an unusable item instead of failing the meal, and caps the list at 12', () => {
    const many = Array.from({ length: 14 }, (_, i) => item({ label: `food ${i}` }));
    const r = toMealParseResult({ items: [item({ grams: 0 }), item({ nutrientsPerPortion: { kcal: -1, protein: null, carbs: null, fat: null, fiber: null } }), ...many] });
    expect(r.ok && r.value.items.map((c) => c.label)).toEqual(many.slice(0, 12).map((c) => c.label));
  });

  it('reads an unknown match kind as no match, and drops an unknown or absent note', () => {
    const r = toMealParseResult({ items: [item({ match: { kind: 'menu', id: 'x' } })], note: 'brand_new' });
    expect(r.ok && [r.value.items[0]?.match.kind, r.value.note]).toEqual([MealMatchKind.None, null]);
    const empty = toMealParseResult({ items: [], note: 'nothing_detected' });
    expect(empty.ok && [empty.value.items.length, empty.value.note]).toEqual([0, 'nothing_detected']);
  });
});
