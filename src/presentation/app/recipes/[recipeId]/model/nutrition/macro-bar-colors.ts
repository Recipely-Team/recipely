import { BrandColors } from '@presentation/base/theme';
import { NutritionMacro, type NutritionMacroType } from '@domain/recipes/nutrition/nutrition-macro';

/** The daily-value bar fill for each macro — fixed across themes. */
export const macroBarColors: Readonly<Record<NutritionMacroType, string>> = {
  [NutritionMacro.Protein]: BrandColors.nutritionProtein,
  [NutritionMacro.Carbs]: BrandColors.nutritionCarbs,
  [NutritionMacro.Fat]: BrandColors.nutritionFat,
  [NutritionMacro.Fiber]: BrandColors.nutritionFiber,
};
