import { CalendarDate } from '@domain/diary/calendar/calendar-date';
import { DiaryDay } from '@domain/diary/day/diary-day';
import { MealSlot } from '@domain/diary/meal-slot';
import { CalorieStatus } from '@domain/diary/nutrition/calorie-status';
import { NutritionGoals } from '@domain/diary/nutrition/nutrition-goals';
import { foodLogEntryOf } from '@domain/diary/__fixtures__/food-log-entry-of';
import { nutrientsOf } from '@domain/diary/__fixtures__/nutrients-of';

const date = CalendarDate.of(2026, 9, 30);
const goals = NutritionGoals.defaults();

const dayWith = (calories: number[]) =>
  DiaryDay.of({
    date,
    goals,
    waterGlasses: 3,
    entries: calories.map((kcal, i) =>
      foodLogEntryOf({ id: `e${i}`, meal: i === 0 ? MealSlot.Breakfast : MealSlot.Dinner, nutrients: nutrientsOf({ calories: kcal }) }),
    ),
  });

describe('DiaryDay', () => {
  it('reports the share of the calorie goal eaten, capped at a full ring', () => {
    expect(dayWith([]).calorieProgress).toBe(0);
    expect(dayWith([500, 500]).calorieProgress).toBeCloseTo(1000 / goals.calories);
    expect(dayWith([goals.calories, 900]).calorieProgress).toBe(1);
  });

  it('groups entries into the four meals in display order, each with its sum', () => {
    const groups = dayWith([400, 600, 500]).mealGroups;
    expect(groups.map((g) => g.meal)).toEqual([MealSlot.Breakfast, MealSlot.Lunch, MealSlot.Dinner, MealSlot.Snacks]);
    expect(groups.map((g) => g.totals.calories)).toEqual([400, 0, 1100, 0]);
  });

  it('derives remaining, over and status from the entries', () => {
    const under = dayWith([400, 600]);
    expect(under.remainingCalories).toBe(1000);
    expect(under.overCalories).toBe(0);
    expect(under.calorieStatus).toBe(CalorieStatus.Under);
    const over = dayWith([1200, 1069]);
    expect(over.overCalories).toBe(269);
    expect(over.calorieStatus).toBe(CalorieStatus.Over);
    expect(DiaryDay.empty(date, goals).calorieStatus).toBe(CalorieStatus.None);
  });

  it('clamps water to 0–12 glasses and reports litres', () => {
    const day = dayWith([]);
    expect(day.withWater(13).waterGlasses).toBe(12);
    expect(day.withWater(-1).canRemoveWater).toBe(false);
    expect(day.withWater(5).waterLiters).toBe(1.25);
    expect(day.withWater(12).canAddWater).toBe(false);
  });

  it('drops an entry without touching the original', () => {
    const day = dayWith([400, 600]);
    expect(day.withoutEntry('e0').totals.calories).toBe(600);
    expect(day.totals.calories).toBe(1000);
  });
});

describe('DiaryDay.withEntry', () => {
  const [a, b, c] = ['a', 'b', 'c'].map((id) => foodLogEntryOf({ id }));
  const order = ['a', 'b', 'c'];
  const day = DiaryDay.of({ date, goals, waterGlasses: 0, entries: [a, b, c].flatMap((e) => (e === undefined ? [] : [e])) });

  it('puts an entry back in its server place, whatever order the undos land in', () => {
    const empty = day.withoutEntry('a').withoutEntry('c');
    if (a === undefined || c === undefined) throw new Error('fixture');
    expect(empty.withEntry(c, order).withEntry(a, order).entries.map((e) => e.id)).toEqual(order);
    expect(empty.withEntry(a, order).withEntry(c, order).entries.map((e) => e.id)).toEqual(order);
  });

  it('appends without an order, and never duplicates', () => {
    if (a === undefined) throw new Error('fixture');
    expect(day.withoutEntry('a').withEntry(a).entries.map((e) => e.id)).toEqual(['b', 'c', 'a']);
    expect(day.withEntry(a).entries).toHaveLength(3);
  });
});
