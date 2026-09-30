import { NutritionGoals } from '@domain/diary/nutrition/nutrition-goals';
import { CalorieStatus } from '@domain/diary/nutrition/calorie-status';

describe('NutritionGoals', () => {
  const goals = NutritionGoals.defaults();

  it('defaults to the design spec targets', () => {
    expect(goals.value).toEqual({ calories: 2000, protein: 120, carbs: 230, fat: 65, fiber: 30, waterGlasses: 8 });
  });

  it.each([
    [1799, CalorieStatus.Under],
    [1800, CalorieStatus.On],
    [2000, CalorieStatus.On],
    [2200, CalorieStatus.On],
    [2201, CalorieStatus.Over],
    [2500, CalorieStatus.Over],
    [2501, CalorieStatus.Far],
  ])('reads %i kcal against 2000 as %s', (eaten, status) => {
    expect(goals.calorieStatus(eaten, true)).toBe(status);
  });

  it('is none when nothing was logged, whatever the kcal', () => {
    expect(goals.calorieStatus(0, false)).toBe(CalorieStatus.None);
  });

  it('counts remaining kcal down past zero', () => {
    expect(goals.remainingCalories(2269)).toBe(-269);
  });

  it('refuses values outside the backend ranges', () => {
    const base = goals.value;
    expect(NutritionGoals.create({ ...base, calories: 499 }).ok).toBe(false);
    expect(NutritionGoals.create({ ...base, calories: 2000.5 }).ok).toBe(false);
    expect(NutritionGoals.create({ ...base, fiber: 601 }).ok).toBe(false);
    expect(NutritionGoals.create({ ...base, waterGlasses: 0 }).ok).toBe(false);
    expect(NutritionGoals.create({ ...base, waterGlasses: 13 }).ok).toBe(false);
    expect(NutritionGoals.create({ ...base, calories: 500 }).ok).toBe(true);
    expect(NutritionGoals.create(base).ok).toBe(true);
  });

  it('warns only when the macros miss the calorie goal by more than 10 %', () => {
    expect(goals.macrosDisagreeWithCalories).toBe(false);
    const created = NutritionGoals.create({ ...goals.value, fat: 120 });
    expect(created.ok && created.value.macrosDisagreeWithCalories).toBe(true);
  });
});
