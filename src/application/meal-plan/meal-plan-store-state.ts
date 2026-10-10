import type { Result } from '@core/result/result';
import type { Failure } from '@core/failure';
import type { CalendarDate } from '@domain/diary/calendar/calendar-date';
import type { MealSlotType } from '@domain/diary/meal-slot';
import type { Servings } from '@domain/diary/entry/servings';
import type { RecipeFoodHit } from '@domain/diary/foods/search/recipe-food-hit';
import type { RecipeHitGroupType } from '@domain/diary/foods/search/recipe-hit-group-type';
import type { MealPlanEntryEntity } from '@domain/meal-plan/meal-plan-entry-entity';
import type { NewMealPlanEntry } from '@domain/meal-plan/week/new-meal-plan-entry';
import type { CopyMealPlanResult } from '@domain/meal-plan/week/copy-meal-plan-result';
import type { PlanShoppingLine } from '@domain/meal-plan/shopping/plan-shopping-line';
import type { PagedList } from '@application/store/paging/paged-list';
import type { MealPlanWeekState } from '@application/meal-plan/meal-plan-week-state';

export interface MealPlanStoreState {
  /** The `mealPlanner` flag; null until asked. Off, every entry point renders nothing. */
  enabled: boolean | null;
  /** The Monday of the week the Plan view shows. */
  weekStart: CalendarDate;
  /** Weeks by their Monday's `CalendarDate.value`; a missing key is "not loaded yet". */
  weeks: Readonly<Record<string, MealPlanWeekState>>;
  /** The add sheet's recipe list (saved, mine or every recipe), paged on scroll. */
  recipes: PagedList<RecipeFoodHit>;
  /** Resolves the flag once (admin override, else build value). */
  checkEnabled: () => Promise<boolean>;
  /** Shows the week holding `day` and loads it. */
  showWeek: (day: CalendarDate) => void;
  /** Loads (or refreshes) the week holding `day`; a loaded week stays on screen and keeps its rows on a failed refresh. */
  load: (day: CalendarDate) => Promise<void>;
  /** Resolves once the server answers; the meal joins its week then. */
  add: (entry: NewMealPlanEntry, today: CalendarDate) => Promise<Result<MealPlanEntryEntity, Failure>>;
  /** Shows the new servings at once; the old ones come back on refusal. */
  setServings: (entry: MealPlanEntryEntity, servings: Servings) => Promise<Result<MealPlanEntryEntity, Failure>>;
  /** Moves to another day or meal, at the end of that slot. */
  move: (entry: MealPlanEntryEntity, date: CalendarDate, meal: MealSlotType) => Promise<Result<MealPlanEntryEntity, Failure>>;
  /** Removes at once; puts it back on refusal. */
  remove: (entry: MealPlanEntryEntity) => Promise<Result<void, Failure>>;
  /** Shows the tick at once; the server's answer (with its diary entry id) replaces it, a refusal undoes it. */
  setEaten: (entry: MealPlanEntryEntity, eaten: boolean, today: CalendarDate) => Promise<Result<MealPlanEntryEntity, Failure>>;
  /** Empties the week at once and answers the meals it held, for an undo; a refusal brings them back. */
  clearWeek: (day: CalendarDate) => Promise<Result<readonly MealPlanEntryEntity[], Failure>>;
  /** Plans the given meals again (undo), then reloads their weeks. */
  restore: (entries: readonly MealPlanEntryEntity[]) => Promise<Result<MealPlanEntryEntity[], Failure>>;
  /** Copies the week before into this one, then reloads it. */
  copyPreviousWeek: (day: CalendarDate) => Promise<Result<CopyMealPlanResult, Failure>>;
  /** The week's merged, scaled ingredients for the shopping confirm. */
  shoppingList: (day: CalendarDate) => Promise<Result<PlanShoppingLine[], Failure>>;
  /** First page of a recipe group; an empty query lists the group unfiltered. */
  searchRecipes: (query: string, group: RecipeHitGroupType) => Promise<void>;
  loadMoreRecipes: () => Promise<void>;
  /** Drops the signed-in user's plan. Called when the session ends. */
  clear: () => void;
}
