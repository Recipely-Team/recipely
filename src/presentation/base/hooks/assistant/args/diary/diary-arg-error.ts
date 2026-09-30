/**
 * The reasons a diary action refuses its arg, as the model reads them.
 *
 * @remarks
 * - **Snake case like every other handler's `error`**, and specific enough to
 *   act on: `future_date` tells the model to pick another day, `unknown_food`
 *   tells it to estimate the nutrition and call again (backend persona).
 */
export const DiaryArgError = {
  InvalidJson: 'invalid_json',
  MissingName: 'missing_name',
  InvalidDate: 'invalid_date_use_yyyy_mm_dd_today_or_yesterday',
  FutureDate: 'future_date_has_not_happened_yet',
  InvalidMeal: 'invalid_meal_use_breakfast_lunch_dinner_or_snacks',
  InvalidServings: 'invalid_servings_use_0_5_steps_from_0_5_to_20',
  InvalidNumber: 'not_a_number',
  NothingToSet: 'nothing_to_set',
  UnknownFood: 'unknown_food_estimate_per_serving_nutrition_and_call_again_with_calories',
} as const;
