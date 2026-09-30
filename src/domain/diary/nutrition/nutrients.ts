import { fail, ok } from '@core/result/result-helpers';
import type { Result } from '@core/result/result';
import { ErrorMessageKey, ValidationFailure } from '@core/failure';
import { DiagnosticMessage } from '@core/failure/diagnostic-message';
import { ValueConstants } from '@core/constants';
import { BaseValueObject } from '@core/value-object/base-value-object';
import type { NutrientValues } from '@domain/diary/nutrition/nutrient-values';
import { DiaryLimits } from '@domain/diary/diary-limits';

const KCAL_PER_GRAM_PROTEIN = 4;
const KCAL_PER_GRAM_CARBS = 4;
const KCAL_PER_GRAM_FAT = 9;
const FIELDS = ['calories', 'protein', 'carbs', 'fat', 'fiber'] as const;

const addNullable = (a: number | null, b: number | null): number | null =>
  a === null ? b : b === null ? a : a + b;

const scaleNullable = (value: number | null, factor: number): number | null =>
  value === null ? null : value * factor;

/**
 * Calories and macros of an amount of food — an entry, a day, a serving.
 *
 * @remarks
 * - **Null is "not reported", never zero.** Adding ignores a null addend, so a
 *   calories-only entry still counts toward the day's kcal without inventing
 *   0 g of protein; a field stays null only while every addend is null.
 * - **Never rounded here.** Entry values are snapshots at log time and totals
 *   are exact sums (design spec §3); rounding is a display concern.
 * - **Equality is by every field**, overriding the base's reference check.
 */
export class Nutrients extends BaseValueObject<NutrientValues> {
  private constructor(values: NutrientValues) {
    super(values);
  }

  static create(values: NutrientValues): Result<Nutrients, ValidationFailure> {
    for (const field of FIELDS) {
      const value = values[field];
      if (value !== null && (!Number.isFinite(value) || value < ValueConstants.zero)) {
        return fail(new ValidationFailure(DiagnosticMessage.diary.nutrientInvalid(field), field, ErrorMessageKey.diaryNutrientInvalid));
      }
    }
    return ok(new Nutrients(values));
  }

  static zero(): Nutrients {
    return new Nutrients({ calories: ValueConstants.zero, protein: null, carbs: null, fat: null, fiber: null });
  }

  /** Σ of every item, ignoring nulls; an empty list is zero kcal and no macros. */
  static sum(items: readonly Nutrients[]): Nutrients {
    return items.reduce((total, item) => total.plus(item), Nutrients.zero());
  }

  get calories(): number {
    return this._value.calories;
  }

  get protein(): number | null {
    return this._value.protein;
  }

  get carbs(): number | null {
    return this._value.carbs;
  }

  get fat(): number | null {
    return this._value.fat;
  }

  get fiber(): number | null {
    return this._value.fiber;
  }

  /** Whether any of protein, carbs or fat is known — the UI's "calories only" test. */
  get hasMacros(): boolean {
    return this.protein !== null || this.carbs !== null || this.fat !== null;
  }

  /** Whether every figure is within one entry's plausibility caps (20 000 kcal, 2 000 g). */
  get isWithinEntryCaps(): boolean {
    const grams = [this.protein, this.carbs, this.fat, this.fiber];
    return this.calories <= DiaryLimits.EntryCaloriesMax && grams.every((g) => g === null || g <= DiaryLimits.EntryMacroMax);
  }

  /** Kcal the known macros account for, at 4 / 4 / 9 kcal per gram. */
  get macroCalories(): number {
    return (
      (this.protein ?? ValueConstants.zero) * KCAL_PER_GRAM_PROTEIN +
      (this.carbs ?? ValueConstants.zero) * KCAL_PER_GRAM_CARBS +
      (this.fat ?? ValueConstants.zero) * KCAL_PER_GRAM_FAT
    );
  }

  plus(other: Nutrients): Nutrients {
    return new Nutrients({
      calories: this.calories + other.calories,
      protein: addNullable(this.protein, other.protein),
      carbs: addNullable(this.carbs, other.carbs),
      fat: addNullable(this.fat, other.fat),
      fiber: addNullable(this.fiber, other.fiber),
    });
  }

  /** Every figure times `factor`; a null stays null. `factor` must be non-negative. */
  scale(factor: number): Nutrients {
    return new Nutrients({
      calories: this.calories * factor,
      protein: scaleNullable(this.protein, factor),
      carbs: scaleNullable(this.carbs, factor),
      fat: scaleNullable(this.fat, factor),
      fiber: scaleNullable(this.fiber, factor),
    });
  }

  override equals(other: Nutrients): boolean {
    return FIELDS.every((field) => this._value[field] === other.value[field]);
  }
}
