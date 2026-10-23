import type { TranslationsType } from '@presentation/i18n';
import type { MealSlotType } from '@domain/diary/meal-slot';

/** The localized name of a meal slot. */
export const mealLabel = (t: TranslationsType, meal: MealSlotType): string => t.diary.meals[meal];
