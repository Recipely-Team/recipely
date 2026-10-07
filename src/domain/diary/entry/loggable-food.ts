import { fail, ok } from '@core/result/result-helpers';
import type { Result } from '@core/result/result';
import { ErrorMessageKey, ValidationFailure } from '@core/failure';
import { DiagnosticMessage } from '@core/failure/diagnostic-message';
import { ValueConstants } from '@core/constants';
import { DiaryLimits } from '@domain/diary/diary-limits';
import type { CalendarDate } from '@domain/diary/calendar/calendar-date';
import type { MealSlotType } from '@domain/diary/meal-slot';
import { Nutrients } from '@domain/diary/nutrition/nutrients';
import type { Servings } from '@domain/diary/entry/servings';
import type { LoggableFoodProps } from '@domain/diary/entry/loggable-food-props';
import type { NewFoodLogEntry } from '@domain/diary/entry/new-food-log-entry';
import type { RecipeEntity } from '@domain/recipes/recipe-entity';

/** The recipe API sends 0 for "never filled in" as well as a measured zero (see `NutritionFacts`). */
const reported = (value: number | undefined): number | null =>
  value !== undefined && value > ValueConstants.zero ? value : null;

/**
 * Something the Add food sheet can log: a recipe, a recent food or a quick
 * add, reduced to one serving's nutrients.
 *
 * @remarks
 * - **One serving is the unit** (v1 has no grams or pieces — design spec
 *   scope cut), so the detail step's total box is `nutrientsFor(servings)`.
 * - **`of` is total** for foods whose source was already validated (a recent
 *   food); a recipe goes through `fromRecipe`, hand-typed input through `quickAdd`.
 * - **A recipe is read by value**: only its id is kept, as `recipeId`.
 */
export class LoggableFood {
  private constructor(private readonly props: LoggableFoodProps) {}

  static of(props: LoggableFoodProps): LoggableFood {
    return new LoggableFood(props);
  }

  /**
   * One serving of `recipe`. Refused without `caloriesPerServing > 0` (the
   * detail screen hides "Add to diary" for it); a calories-only recipe gives
   * null macros, so the UI shows "calories only" (design spec §3).
   */
  static fromRecipe(recipe: Pick<RecipeEntity, 'id' | 'name' | 'image' | 'caloriesPerServing' | 'nutrition'>): Result<LoggableFood, ValidationFailure> {
    const calories = reported(recipe.caloriesPerServing);
    if (calories === null) {
      return fail(new ValidationFailure(DiagnosticMessage.diary.recipeWithoutCalories, 'caloriesPerServing'));
    }
    const { nutrition } = recipe;
    const perServing = Nutrients.create({
      calories,
      protein: reported(nutrition?.protein),
      carbs: reported(nutrition?.carbs),
      fat: reported(nutrition?.fat),
      fiber: reported(nutrition?.fiber),
    });
    if (!perServing.ok) return perServing;
    const imageUrl = recipe.image.length > ValueConstants.zero ? recipe.image : null;
    return ok(new LoggableFood({ name: recipe.name, perServing: perServing.value, recipeId: recipe.id, imageUrl }));
  }

  /**
   * A food typed in by hand — the Quick add tab. The name is trimmed and must
   * fit 1–120 characters; one serving must have calories (> 0) and stay within
   * the entry caps. Failures
   * carry the backend's `messageKey`, so the form shows the same copy the
   * server would have caused.
   */
  static quickAdd(name: string, perServing: Nutrients): Result<LoggableFood, ValidationFailure> {
    const trimmed = name.trim();
    if (trimmed.length === ValueConstants.zero) {
      return fail(new ValidationFailure(DiagnosticMessage.diary.foodNameRequired, 'name', ErrorMessageKey.diaryFoodNameRequired));
    }
    if (trimmed.length > DiaryLimits.NameMaxLength) {
      return fail(new ValidationFailure(DiagnosticMessage.diary.foodNameTooLong, 'name', ErrorMessageKey.diaryFoodNameTooLong));
    }
    if (perServing.calories <= ValueConstants.zero || !perServing.isWithinEntryCaps) {
      return fail(new ValidationFailure(DiagnosticMessage.diary.nutrientTooHigh('calories'), 'calories', ErrorMessageKey.diaryNutrientInvalid));
    }
    return ok(new LoggableFood({ name: trimmed, perServing, recipeId: null, imageUrl: null }));
  }

  get name(): string {
    return this.props.name;
  }

  get perServing(): Nutrients {
    return this.props.perServing;
  }

  get recipeId(): string | null {
    return this.props.recipeId;
  }

  get imageUrl(): string | null {
    return this.props.imageUrl;
  }

  /** A quick add has no recipe behind it — the UI shows a bolt tile instead of a photo. */
  get isQuickAdd(): boolean {
    return this.props.recipeId === null;
  }

  nutrientsFor(servings: Servings): Nutrients {
    return this.props.perServing.scale(servings.value);
  }

  entryFor(date: CalendarDate, meal: MealSlotType, servings: Servings): NewFoodLogEntry {
    return {
      date,
      meal,
      name: this.props.name,
      servings: servings.value,
      nutrients: this.nutrientsFor(servings),
      recipeId: this.props.recipeId,
      product: null,
    };
  }
}
