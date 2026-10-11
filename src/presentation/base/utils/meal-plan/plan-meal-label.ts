import type { MealSlotType } from '@domain/diary/meal-slot';
import { t } from '@presentation/i18n';

/** The planner's name for a meal slot — "Snack", where the diary says "Snacks". */
export const planMealLabel = (meal: MealSlotType): string => t().mealPlan.meals[meal];
