import { fail, ok } from '@core/result/result-helpers';
import type { Result } from '@core/result/result';
import { ValidationFailure } from '@core/failure';
import { DiagnosticMessage } from '@core/failure/diagnostic-message';
import { ValueConstants } from '@core/constants';
import { DiaryLimits } from '@domain/diary/diary-limits';
import type { CalendarDate } from '@domain/diary/calendar/calendar-date';
import type { MealSlotType } from '@domain/diary/meal-slot';
import type { Nutrients } from '@domain/diary/nutrition/nutrients';
import type { NewFoodLogEntry } from '@domain/diary/entry/new-food-log-entry';
import { FoodSource } from '@domain/diary/foods/food-source';
import { FoodBaseUnit } from '@domain/diary/foods/units/food-base-unit';
import { MealMatchKind } from '@domain/diary/meal/meal-match-kind';
import type { MealMatch } from '@domain/diary/meal/meal-match';
import type { MealCandidateProps } from '@domain/diary/meal/meal-candidate-props';

const isPositive = (value: number): boolean => Number.isFinite(value) && value > ValueConstants.zero;

const clampGrams = (grams: number): number =>
  Math.min(DiaryLimits.ProductQuantityMax, Math.max(DiaryLimits.MealGramsMin, Math.round(grams)));

/**
 * One item the meal parser found in a description or photo, as the confirm
 * list edits and logs it.
 *
 * @remarks
 * - **Grams rescale linearly from the parser's portion**: nutrients are
 *   `portion × grams / portionGrams`, never rounded here (display rounds).
 * - **Edited grams are whole, from 1 g to the product cap** (5000, the
 *   backend's quantity cap for a product entry); `withGrams` clamps, never fails.
 * - **A catalogue food logs as a product counted in grams** (`servings` is the
 *   gram amount, unit `g`), so the entry keeps its reference (rule 20). Every
 *   other item — a recipe match or no match — logs as one serving of a quick
 *   add with the item's own figures.
 */
export class MealCandidate {
  private constructor(private readonly props: MealCandidateProps) {}

  static create(props: MealCandidateProps): Result<MealCandidate, ValidationFailure> {
    const label = props.label.trim().slice(ValueConstants.zero, DiaryLimits.NameMaxLength);
    if (label.length === ValueConstants.zero || !isPositive(props.grams) || !isPositive(props.portionGrams)) {
      return fail(new ValidationFailure(DiagnosticMessage.diary.mealItemInvalid, 'grams'));
    }
    const confidence = Math.min(ValueConstants.one, Math.max(ValueConstants.zero, props.confidence));
    return ok(new MealCandidate({ ...props, label, confidence, grams: clampGrams(props.grams) }));
  }

  get label(): string {
    return this.props.label;
  }

  get grams(): number {
    return this.props.grams;
  }

  get match(): MealMatch {
    return this.props.match;
  }

  get estimated(): boolean {
    return this.props.estimated;
  }

  get confidence(): number {
    return this.props.confidence;
  }

  /** Whether the item is a catalogue food the diary can reference by its variant. */
  get isCatalogueFood(): boolean {
    return this.props.match.kind === MealMatchKind.Food && this.props.match.id !== null;
  }

  /** Nutrients of the current `grams`. */
  get nutrients(): Nutrients {
    return this.props.portion.scale(this.props.grams / this.props.portionGrams);
  }

  /** The same item at another amount, clamped and whole; a non-number keeps this one. */
  withGrams(grams: number): MealCandidate {
    if (!Number.isFinite(grams)) return this;
    return new MealCandidate({ ...this.props, grams: clampGrams(grams) });
  }

  entryFor(date: CalendarDate, meal: MealSlotType): NewFoodLogEntry {
    const base = { date, meal, name: this.props.label, nutrients: this.nutrients, recipeId: null };
    if (!this.isCatalogueFood) return { ...base, servings: ValueConstants.one, product: null };
    return {
      ...base,
      servings: this.props.grams,
      product: {
        source: FoodSource.Curated,
        foodVariantId: this.props.match.id,
        offBarcode: null,
        unitKey: FoodBaseUnit.Grams,
        unitAmount: ValueConstants.one,
      },
    };
  }
}
