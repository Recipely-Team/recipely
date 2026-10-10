import { ValueConstants } from '@core/constants';
import type { CalendarDate } from '@domain/diary/calendar/calendar-date';
import { MealSlot, type MealSlotType } from '@domain/diary/meal-slot';
import type { MealPlanEntryEntity } from '@domain/meal-plan/meal-plan-entry-entity';
import { MealPlanLimits } from '@domain/meal-plan/meal-plan-limits';

const MEAL_ORDER: readonly MealSlotType[] = Object.values(MealSlot);
const LAST_DAY_OFFSET = MealPlanLimits.daysPerWeek - ValueConstants.one;

const byPlanOrder = (a: MealPlanEntryEntity, b: MealPlanEntryEntity): number =>
  a.date.compare(b.date) || MEAL_ORDER.indexOf(a.meal) - MEAL_ORDER.indexOf(b.meal) || a.position - b.position;

const sumCalories = (entries: readonly MealPlanEntryEntity[]): number =>
  entries.reduce((total, entry) => total + (entry.calories ?? ValueConstants.zero), ValueConstants.zero);

/**
 * One Monday-to-Sunday week of the plan, and every sum the screens draw from it.
 *
 * @remarks
 * - **Always a whole week**: `of` snaps any day to its Monday and keeps only
 *   the entries inside, in the server's order (date, meal, position).
 * - **A meal without calories counts as 0** in every total.
 * - **The past is closed**: `canPlanOn` refuses a day before today, and a
 *   full day (`MealPlanLimits.entriesPerDay`) takes no more.
 * - Immutable: `withEntry` / `without` return a new week, which is how a
 *   store shows a write before the server answers.
 */
export class MealPlanWeek {
  private constructor(
    readonly start: CalendarDate,
    private readonly list: readonly MealPlanEntryEntity[],
  ) {}

  static of(day: CalendarDate, entries: readonly MealPlanEntryEntity[]): MealPlanWeek {
    const start = day.weekStart();
    const end = start.addDays(LAST_DAY_OFFSET);
    return new MealPlanWeek(start, entries.filter((entry) => !entry.date.isBefore(start) && !entry.date.isAfter(end)).sort(byPlanOrder));
  }

  get end(): CalendarDate {
    return this.start.addDays(LAST_DAY_OFFSET);
  }

  get days(): CalendarDate[] {
    return this.start.weekDays();
  }

  get entries(): readonly MealPlanEntryEntity[] {
    return this.list;
  }

  get isEmpty(): boolean {
    return this.list.length === ValueConstants.zero;
  }

  get mealCount(): number {
    return this.list.length;
  }

  /** Total kcal over the days that have a meal, divided by those days; 0 for an empty week. */
  get averageDailyCalories(): number {
    const planned = new Set(this.list.map((entry) => entry.date.value)).size;
    return planned === ValueConstants.zero ? ValueConstants.zero : Math.round(sumCalories(this.list) / planned);
  }

  entriesOn(date: CalendarDate, meal?: MealSlotType): readonly MealPlanEntryEntity[] {
    return this.list.filter((entry) => entry.date.equals(date) && (meal === undefined || entry.meal === meal));
  }

  dayCalories(date: CalendarDate): number {
    return sumCalories(this.entriesOn(date));
  }

  slotCalories(date: CalendarDate, meal: MealSlotType): number {
    return sumCalories(this.entriesOn(date, meal));
  }

  isDayFull(date: CalendarDate): boolean {
    return this.entriesOn(date).length >= MealPlanLimits.entriesPerDay;
  }

  /** Today or later — a day that has passed is neither planned nor a move target. */
  canPlanOn(date: CalendarDate, today: CalendarDate): boolean {
    return !date.isBefore(today);
  }

  contains(date: CalendarDate): boolean {
    return !date.isBefore(this.start) && !date.isAfter(this.end);
  }

  find(id: string): MealPlanEntryEntity | undefined {
    return this.list.find((entry) => entry.id === id);
  }

  /** The entry put in (or replaced) in its place; one dated outside this week leaves it. */
  withEntry(entry: MealPlanEntryEntity): MealPlanWeek {
    return MealPlanWeek.of(this.start, [...this.list.filter((item) => item.id !== entry.id), entry]);
  }

  without(id: string): MealPlanWeek {
    return new MealPlanWeek(this.start, this.list.filter((entry) => entry.id !== id));
  }
}
