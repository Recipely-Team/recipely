/** The macronutrients a recipe reports, in the order they are presented. */
export const NutritionMacro = {
  Protein: 'protein',
  Carbs: 'carbs',
  Fat: 'fat',
  Fiber: 'fiber',
} as const;

export type NutritionMacroType = (typeof NutritionMacro)[keyof typeof NutritionMacro];
