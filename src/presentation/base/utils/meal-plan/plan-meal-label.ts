import type { TranslationsType } from '@presentation/i18n';
import type { MealSlotType } from '@domain/diary/meal-slot';

/** The planner's name for a meal slot — "Snack", where the diary says "Snacks". */
export const planMealLabel = (t: TranslationsType, meal: MealSlotType): string => t.mealPlan.meals[meal];
