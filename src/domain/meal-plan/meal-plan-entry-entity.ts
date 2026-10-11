import { BaseEntity } from '@core/entity/base-entity';
import { fail, ok } from '@core/result/result-helpers';
import type { Result } from '@core/result/result';
import { ValidationFailure } from '@core/failure';
import { DiagnosticMessage } from '@core/failure/diagnostic-message';
import { isBlank } from '@core/guards/type-guards';
import type { CalendarDate } from '@domain/diary/calendar/calendar-date';
import type { MealSlotType } from '@domain/diary/meal-slot';
import type { Servings } from '@domain/diary/entry/servings';
import type { PlannedRecipe } from '@domain/meal-plan/planned-recipe';
import type { NewMealPlanEntry } from '@domain/meal-plan/week/new-meal-plan-entry';
import type { MealPlanEntryEntityProps } from '@domain/meal-plan/meal-plan-entry-entity-props';
import { MealPlanLimits } from '@domain/meal-plan/meal-plan-limits';

/**
 * One planned meal — the meal-plan aggregate root (backend #392).
 *
 * @remarks
 * - **Calories are derived, never stored**: `caloriesPerServing × servings`,
 *   or null while the recipe has no nutrition.
 * - **Eating is the server's write**: `POST /entries/:id/eaten` logs the diary
 *   entry; `withEaten` only shows the answer early.
 * - **A future meal cannot be eaten yet** (`canMarkEaten`), and an eaten one
 *   keeps its servings — the diary already holds them.
 */
export class MealPlanEntryEntity extends BaseEntity<MealPlanEntryEntityProps> {
  private constructor(props: MealPlanEntryEntityProps) {
    super(props);
  }

  static create(props: MealPlanEntryEntityProps): Result<MealPlanEntryEntity, ValidationFailure> {
    if (isBlank(props.id)) return fail(new ValidationFailure(DiagnosticMessage.mealPlan.idRequired, 'id'));
    if (isBlank(props.recipe.id) || isBlank(props.recipe.name)) {
      return fail(new ValidationFailure(DiagnosticMessage.mealPlan.recipeRequired, 'recipe'));
    }
    const { position } = props;
    if (!Number.isInteger(position) || position < MealPlanLimits.positionMin || position > MealPlanLimits.positionMax) {
      return fail(new ValidationFailure(DiagnosticMessage.mealPlan.positionInvalid, 'position'));
    }
    return ok(new MealPlanEntryEntity(props));
  }

  get date(): CalendarDate {
    return this.props.date;
  }

  get meal(): MealSlotType {
    return this.props.meal;
  }

  get position(): number {
    return this.props.position;
  }

  get servings(): Servings {
    return this.props.servings;
  }

  get eaten(): boolean {
    return this.props.eaten;
  }

  get foodLogEntryId(): string | null {
    return this.props.foodLogEntryId;
  }

  get recipe(): PlannedRecipe {
    return this.props.recipe;
  }

  /** Whole kcal for the planned servings; null when the recipe has no calories. */
  get calories(): number | null {
    const perServing = this.props.recipe.caloriesPerServing;
    return perServing === null ? null : Math.round(perServing * this.props.servings.value);
  }

  /** Servings change until the meal is eaten; the diary holds them after that. */
  get canChangeServings(): boolean {
    return !this.props.eaten;
  }

  /** Today or earlier — a meal that is still ahead cannot have been eaten. */
  canMarkEaten(today: CalendarDate): boolean {
    return !this.props.date.isAfter(today);
  }

  withServings(servings: Servings): MealPlanEntryEntity {
    return new MealPlanEntryEntity({ ...this.props, servings });
  }

  withEaten(eaten: boolean): MealPlanEntryEntity {
    return new MealPlanEntryEntity({ ...this.props, eaten, foodLogEntryId: eaten ? this.props.foodLogEntryId : null });
  }

  /** The same meal planned afresh — what an undo sends back. */
  toNew(): NewMealPlanEntry {
    return { date: this.props.date, meal: this.props.meal, recipeId: this.props.recipe.id, servings: this.props.servings };
  }
}
