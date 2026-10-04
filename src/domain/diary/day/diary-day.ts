import { ValueConstants } from '@core/constants';
import { DiaryLimits } from '@domain/diary/diary-limits';
import type { CalendarDate } from '@domain/diary/calendar/calendar-date';
import type { FoodLogEntryEntity } from '@domain/diary/food-log-entry-entity';
import { MealSlot, type MealSlotType } from '@domain/diary/meal-slot';
import { Nutrients } from '@domain/diary/nutrition/nutrients';
import type { NutritionGoals } from '@domain/diary/nutrition/nutrition-goals';
import type { CalorieStatusType } from '@domain/diary/nutrition/calorie-status';
import type { MealGroup } from '@domain/diary/day/meal-group';
import type { DiaryDayProps } from '@domain/diary/day/diary-day-props';

/**
 * One day of the diary as the Day view reads it — a read model over the day's
 * entries, its water and the goals in force.
 *
 * @remarks
 * - **Totals are derived from the entries**, not taken from the server's
 *   `totals`, so an optimistic `withoutEntry` stays consistent with itself.
 * - **Copies, never mutation.** `withWater` / `withoutEntry` / `withEntry` / `withGoals`
 *   return a new day; the store swaps it into its cache.
 * - Water is clamped to 0–12 glasses on the way in.
 */
export class DiaryDay {
  private constructor(private readonly props: DiaryDayProps) {}

  /** Total: the entries were validated one by one, and water is clamped. */
  static of(props: DiaryDayProps): DiaryDay {
    const waterGlasses = Math.min(DiaryLimits.WaterGlassesMax, Math.max(DiaryLimits.WaterGlassesMin, props.waterGlasses));
    return new DiaryDay({ ...props, waterGlasses });
  }

  static empty(date: CalendarDate, goals: NutritionGoals): DiaryDay {
    return new DiaryDay({ date, entries: [], waterGlasses: DiaryLimits.WaterGlassesMin, goals });
  }

  get date(): CalendarDate {
    return this.props.date;
  }

  get entries(): readonly FoodLogEntryEntity[] {
    return this.props.entries;
  }

  get goals(): NutritionGoals {
    return this.props.goals;
  }

  get hasEntries(): boolean {
    return this.props.entries.length > ValueConstants.zero;
  }

  get totals(): Nutrients {
    return Nutrients.sum(this.props.entries.map((entry) => entry.nutrients));
  }

  /** Kcal left against the goal; negative once over (the ring shows `+|n|`). */
  get remainingCalories(): number {
    return this.props.goals.remainingCalories(this.totals.calories);
  }

  get overCalories(): number {
    return Math.max(ValueConstants.zero, -this.remainingCalories);
  }

  get calorieStatus(): CalorieStatusType {
    return this.props.goals.calorieStatus(this.totals.calories, this.hasEntries);
  }

  /** The four meal cards, in display order, each with its own sum. */
  get mealGroups(): MealGroup[] {
    return Object.values(MealSlot).map((meal) => {
      const entries = this.entriesFor(meal);
      return { meal, entries, totals: Nutrients.sum(entries.map((entry) => entry.nutrients)) };
    });
  }

  entriesFor(meal: MealSlotType): FoodLogEntryEntity[] {
    return this.props.entries.filter((entry) => entry.meal === meal);
  }

  get waterGlasses(): number {
    return this.props.waterGlasses;
  }

  get waterLiters(): number {
    return (this.props.waterGlasses * DiaryLimits.WaterGlassMilliliters) / DiaryLimits.MillilitersPerLiter;
  }

  get canAddWater(): boolean {
    return this.props.waterGlasses < DiaryLimits.WaterGlassesMax;
  }

  get canRemoveWater(): boolean {
    return this.props.waterGlasses > DiaryLimits.WaterGlassesMin;
  }

  withWater(glasses: number): DiaryDay {
    return DiaryDay.of({ ...this.props, waterGlasses: glasses });
  }

  withoutEntry(id: string): DiaryDay {
    return new DiaryDay({ ...this.props, entries: this.props.entries.filter((entry) => entry.id !== id) });
  }

  /**
   * The day with `entry` back in it — a failed delete's undo.
   *
   * `order` is the ids in the order the server listed them; the entry goes in
   * before the first present entry that the order puts after it, so undoing
   * two overlapping deletes in either order restores the original sequence.
   * Without `order` (or with an entry it does not name) it joins the end.
   * Already present means no change, so a double undo cannot duplicate a row.
   */
  withEntry(entry: FoodLogEntryEntity, order: readonly string[] = []): DiaryDay {
    if (this.props.entries.some((existing) => existing.id === entry.id)) return this;
    const rank = order.indexOf(entry.id);
    const before =
      rank === ValueConstants.minusOne
        ? ValueConstants.minusOne
        : this.props.entries.findIndex((existing) => order.indexOf(existing.id) > rank);
    const entries = [...this.props.entries];
    entries.splice(before === ValueConstants.minusOne ? entries.length : before, ValueConstants.zero, entry);
    return new DiaryDay({ ...this.props, entries });
  }

  withGoals(goals: NutritionGoals): DiaryDay {
    return new DiaryDay({ ...this.props, goals });
  }
}
