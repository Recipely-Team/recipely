/**
 * What a recipe starts as before anyone has said otherwise.
 *
 * These are the values a blank editor opens with AND the fallbacks a generated
 * or resumed recipe gets when the backend sent a zero — a recipe that claims to
 * take no time and serve nobody is a gap in the data, not an instruction.
 */
export const EditableDefaults = {
  prepTimeMinutes: 15,
  cookTimeMinutes: 20,
  servings: 4,
} as const;
