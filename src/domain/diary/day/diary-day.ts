import { ValueConstants } from '@core/constants';
import type { CalendarDate } from '@domain/diary/calendar/calendar-date';
import type { FoodLogEntryEntity } from '@domain/diary/food-log-entry-entity';
import { MealSlot, type MealSlotType } from '@domain/diary/meal-slot';
import { Nutrients } from '@domain/diary/nutrition/nutrients';
import type { NutritionGoals } from '@domain/diary/nutrition/nutrition-goals';
import type { CalorieStatusType } from '@domain/diary/nutrition/calorie-status';
import type { MealGroup } from '@domain/diary/day/meal-group';
import type { DiaryDayProps } from '@domain/diary/day/diary-day-props';
import { WaterGlasses } from '@domain/diary/day/water-glasses';

/**
 * One day of the diary as the Day view reads it — a read model over the day's
 * entries, its water and the goals in force.
 *
 * @remarks
 * - **Totals are derived from the entries**, not taken from the server's
 *   `totals`, so an optimistic `withoutEntry` stays consistent with itself.
 * - **Copies, never mutation.** `withWater` / `withoutEntry` / `withEntry` / `withGoals`
 *   return a new day; the store swaps it into its cache.
 * - Water is held as `WaterGlasses`, clamped to 0–12 on the way in.
 */
export class DiaryDay {
  private readonly water: WaterGlasses;

  private constructor(private readonly props: DiaryDayProps) {
    this.water = WaterGlasses.clamped(props.waterGlasses);
  }

  /** Total: the entries were validated one by one, and water is clamped. */
  static of(props: DiaryDayProps): DiaryDay {
    return new DiaryDay(props);
  }

  static empty(date: CalendarDate, goals: NutritionGoals): DiaryDay {
    return new DiaryDay({ date, entries: [], waterGlasses: ValueConstants.zero, goals });
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

  /** Share of the calorie goal eaten, 0..1 for the ring; 0 when no goal is set (never NaN or Infinity). */
  get calorieProgress(): number {
    const goal = this.props.goals.calories;
    if (goal <= ValueConstants.zero) return ValueConstants.zero;
    return Math.min(ValueConstants.one, Math.max(ValueConstants.zero, this.totals.calories / goal));
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
    return this.water.value;
  }

  get waterLiters(): number {
    return this.water.litres;
  }

  get canAddWater(): boolean {
    return this.water.canAdd;
  }

  get canRemoveWater(): boolean {
    return this.water.canRemove;
  }

  withWater(glasses: number): DiaryDay {
    return new DiaryDay({ ...this.props, waterGlasses: glasses });
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
