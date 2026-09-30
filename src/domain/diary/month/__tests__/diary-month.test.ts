import { CalendarDate } from '@domain/diary/calendar/calendar-date';
import { CalendarMonth } from '@domain/diary/calendar/calendar-month';
import { DiaryMonth } from '@domain/diary/month/diary-month';
import { CalorieStatus } from '@domain/diary/nutrition/calorie-status';
import { NutritionGoals } from '@domain/diary/nutrition/nutrition-goals';
import { nutrientsOf } from '@domain/diary/__fixtures__/nutrients-of';

const d = (day: number) => CalendarDate.of(2026, 9, day);
const today = d(30);

const monthWith = (days: Record<number, number>) =>
  DiaryMonth.of({
    month: CalendarMonth.of(today),
    goals: NutritionGoals.defaults(),
    days: Object.entries(days).map(([day, kcal]) => ({ date: d(Number(day)), nutrients: nutrientsOf({ calories: kcal }), entryCount: 1 })),
  });

describe('DiaryMonth', () => {
  it('averages the logged days before today and leaves today out', () => {
    const stats = monthWith({ 27: 1800, 28: 2200, 30: 5000 }).stats(today);
    expect(stats.dailyAverage).toBe(2000);
    expect(stats.daysLogged).toBe(2);
    expect(stats.daysOnTarget).toBe(2);
  });

  it('has no average before anything was logged', () => {
    expect(monthWith({ 30: 1200 }).stats(today).dailyAverage).toBeNull();
  });

  it('counts the streak from yesterday while today is still empty', () => {
    expect(monthWith({ 26: 2000, 28: 2000, 29: 2000 }).stats(today).streak).toBe(2);
  });

  it('counts today in the streak once it is logged', () => {
    expect(monthWith({ 28: 2000, 29: 2000, 30: 2000 }).stats(today).streak).toBe(3);
  });

  it('has no streak when neither today nor yesterday is logged', () => {
    expect(monthWith({ 27: 2000 }).stats(today).streak).toBe(0);
  });

  it('stops the streak at the first of the month', () => {
    const month = monthWith({ 1: 2000, 2: 2000 });
    expect(month.stats(d(2)).streak).toBe(2);
  });

  it('colours each day by kcal against the goal, none when unlogged', () => {
    const month = monthWith({ 27: 2269, 28: 2600 });
    expect(month.statusFor(d(27))).toBe(CalorieStatus.Over);
    expect(month.statusFor(d(28))).toBe(CalorieStatus.Far);
    expect(month.statusFor(d(29))).toBe(CalorieStatus.None);
  });
});
