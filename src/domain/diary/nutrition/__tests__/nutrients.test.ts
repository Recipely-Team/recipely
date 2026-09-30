import { Nutrients } from '@domain/diary/nutrition/nutrients';

const n = (calories: number, protein: number | null, carbs: number | null = null, fat: number | null = null, fiber: number | null = null) => {
  const created = Nutrients.create({ calories, protein, carbs, fat, fiber });
  if (!created.ok) throw new Error(created.failure.message);
  return created.value;
};

describe('Nutrients', () => {
  it('sums ignoring nulls — a calories-only entry adds kcal but invents no macros', () => {
    const total = Nutrients.sum([n(300, null), n(200, 10, 20, 5, null)]);
    expect(total.calories).toBe(500);
    expect(total.protein).toBe(10);
    expect(total.carbs).toBe(20);
    expect(total.fiber).toBeNull();
  });

  it('keeps a field null only while every addend is null', () => {
    const total = Nutrients.sum([n(100, null), n(200, null)]);
    expect(total.protein).toBeNull();
    expect(total.hasMacros).toBe(false);
  });

  it('sums an empty list to zero kcal', () => {
    expect(Nutrients.sum([]).calories).toBe(0);
  });

  it('scales every known figure and leaves nulls alone', () => {
    const scaled = n(300, 20, null, 10, 4).scale(1.5);
    expect(scaled.equals(n(450, 30, null, 15, 6))).toBe(true);
  });

  it('refuses negative or non-finite figures', () => {
    expect(Nutrients.create({ calories: -1, protein: null, carbs: null, fat: null, fiber: null }).ok).toBe(false);
    expect(Nutrients.create({ calories: 1, protein: Number.NaN, carbs: null, fat: null, fiber: null }).ok).toBe(false);
  });

  it('prices the known macros at 4 / 4 / 9 kcal per gram', () => {
    expect(n(0, 10, 20, 5).macroCalories).toBe(165);
  });
});
