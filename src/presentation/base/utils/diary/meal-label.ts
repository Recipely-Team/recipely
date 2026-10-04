import type { MealSlotType } from '@domain/diary/meal-slot';
import { t } from '@presentation/i18n';

/** The localized name of a meal slot. */
export const mealLabel = (meal: MealSlotType): string => t().diary.meals[meal];
