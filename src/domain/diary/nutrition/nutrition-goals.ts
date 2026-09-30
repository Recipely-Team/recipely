import { fail, ok } from '@core/result/result-helpers';
import type { Result } from '@core/result/result';
import { ErrorMessageKey, ValidationFailure } from '@core/failure';
import { DiagnosticMessage } from '@core/failure/diagnostic-message';
import { ValueConstants } from '@core/constants';
import { BaseValueObject } from '@core/value-object/base-value-object';
import { DiaryLimits } from '@domain/diary/diary-limits';
import { CalorieStatus, type CalorieStatusType } from '@domain/diary/nutrition/calorie-status';
import type { NutritionGoalValues } from '@domain/diary/nutrition/nutrition-goal-values';

const DEFAULTS: NutritionGoalValues = {
  calories: 2000,
  protein: 120,
  carbs: 230,
  fat: 65,
  fiber: 30,
  waterGlasses: 8,
};
const ON_TARGET_FROM = 0.9;
const ON_TARGET_UP_TO = 1.1;
const OVER_UP_TO = 1.25;
/** The goals sheet warns once P/C/F kcal drift more than this share from the calorie goal. */
const MACRO_DRIFT_TOLERANCE = 0.1;
const KCAL_PER_GRAM_PROTEIN_OR_CARBS = 4;
const KCAL_PER_GRAM_FAT = 9;
const GRAM_FIELDS = ['protein', 'carbs', 'fat', 'fiber'] as const;

const inRange = (value: number, min: number, max: number): boolean =>
  Number.isFinite(value) && value >= min && value <= max;

/**
 * What a user aims for in a day, and every comparison against it.
 *
 * @remarks
 * - **Defaults** are 2000 kcal · 120 P · 230 C · 65 F · 30 fiber · 8 glasses
 *   (design spec §3) — what a user who never saved goals sees.
 * - **Ranges mirror the backend**: whole kcal 500–6000, grams 0–600, whole
 *   glasses 1–12.
 * - **`calorieStatus`** is the one place the 90 / 110 / 125 % thresholds live.
 */
export class NutritionGoals extends BaseValueObject<NutritionGoalValues> {
  private constructor(values: NutritionGoalValues) {
    super(values);
  }

  static defaults(): NutritionGoals {
    return new NutritionGoals(DEFAULTS);
  }

  static create(values: NutritionGoalValues): Result<NutritionGoals, ValidationFailure> {
    const invalid = (field: string) => fail(new ValidationFailure(DiagnosticMessage.diary.goalInvalid(field), field, ErrorMessageKey.diaryGoalInvalid));
    if (!Number.isInteger(values.calories) || !inRange(values.calories, DiaryLimits.GoalCaloriesMin, DiaryLimits.GoalCaloriesMax)) {
      return invalid('calories');
    }
    const badGram = GRAM_FIELDS.find((field) => !inRange(values[field], ValueConstants.zero, DiaryLimits.GoalMacroMax));
    if (badGram !== undefined) return invalid(badGram);
    if (!Number.isInteger(values.waterGlasses) || !inRange(values.waterGlasses, DiaryLimits.GoalWaterMin, DiaryLimits.WaterGlassesMax)) {
      return invalid('waterGlasses');
    }
    return ok(new NutritionGoals(values));
  }

  /**
   * The calorie goal one −/+ press away from `current`, in 50 kcal steps,
   * clamped to 500–6000. `direction` is read by its sign. Static because the
   * sheet steps a draft value that is not yet a valid `NutritionGoals`.
   */
  static stepCalories(current: number, direction: number): number {
    const next = current + Math.sign(direction) * DiaryLimits.GoalCaloriesStep;
    return Math.min(DiaryLimits.GoalCaloriesMax, Math.max(DiaryLimits.GoalCaloriesMin, next));
  }

  /** Whether a −/+ press from `current` would change anything — the button's enabled state. */
  static canStepCalories(current: number, direction: number): boolean {
    return NutritionGoals.stepCalories(current, direction) !== current;
  }

  get calories(): number {
    return this._value.calories;
  }

  get protein(): number {
    return this._value.protein;
  }

  get carbs(): number {
    return this._value.carbs;
  }

  get fat(): number {
    return this._value.fat;
  }

  get fiber(): number {
    return this._value.fiber;
  }

  get waterGlasses(): number {
    return this._value.waterGlasses;
  }

  /** Kcal left against the goal; negative once over. */
  remainingCalories(eaten: number): number {
    return this.calories - eaten;
  }

  /** `none` when nothing was logged, otherwise the band `eaten ÷ goal` falls in. */
  calorieStatus(eaten: number, hasEntries: boolean): CalorieStatusType {
    if (!hasEntries) return CalorieStatus.None;
    const ratio = eaten / this.calories;
    if (ratio < ON_TARGET_FROM) return CalorieStatus.Under;
    if (ratio <= ON_TARGET_UP_TO) return CalorieStatus.On;
    if (ratio <= OVER_UP_TO) return CalorieStatus.Over;
    return CalorieStatus.Far;
  }

  /** Kcal the protein, carbs and fat goals add up to, at 4 / 4 / 9. */
  get macroCalories(): number {
    return (this.protein + this.carbs) * KCAL_PER_GRAM_PROTEIN_OR_CARBS + this.fat * KCAL_PER_GRAM_FAT;
  }

  /** Share of the calorie goal (0–1, may exceed 1) one macro's gram goal accounts for, at 4 / 4 / 9 kcal per gram. */
  calorieShare(macro: 'protein' | 'carbs' | 'fat'): number {
    const kcalPerGram = macro === 'fat' ? KCAL_PER_GRAM_FAT : KCAL_PER_GRAM_PROTEIN_OR_CARBS;
    return (this._value[macro] * kcalPerGram) / this.calories;
  }

  /** True when the macro goals miss the calorie goal by more than 10 % — the sheet's warning. */
  get macrosDisagreeWithCalories(): boolean {
    return Math.abs(this.macroCalories - this.calories) / this.calories > MACRO_DRIFT_TOLERANCE;
  }

  override equals(other: NutritionGoals): boolean {
    return (Object.keys(DEFAULTS) as (keyof NutritionGoalValues)[]).every((key) => this._value[key] === other.value[key]);
  }
}
