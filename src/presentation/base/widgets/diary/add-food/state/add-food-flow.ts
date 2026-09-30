import type { CalendarDate } from '@domain/diary/calendar/calendar-date';
import type { LoggableFood } from '@domain/diary/entry/loggable-food';
import type { Servings } from '@domain/diary/entry/servings';
import type { MealSlotType } from '@domain/diary/meal-slot';
import type { AddFoodStepType } from '@presentation/base/widgets/diary/add-food/state/add-food-step';

/** The Add food sheet's state and intents, as `useAddFoodFlow` exposes them. */
export interface AddFoodFlow {
  date: CalendarDate;
  step: AddFoodStepType;
  /** The chosen food; null only on the pick step. */
  food: LoggableFood | null;
  servings: Servings;
  meal: MealSlotType;
  isEdit: boolean;
  /** True when the detail step was reached from the pick step, so "back" has somewhere to go. */
  canGoBack: boolean;
  isSubmitting: boolean;
  choose: (food: LoggableFood) => void;
  back: () => void;
  increment: () => void;
  decrement: () => void;
  setMeal: (meal: MealSlotType) => void;
  /** Adds (or saves the edit); closes and toasts on success. */
  submit: () => Promise<void>;
  /** Logs a quick add straight away, skipping the detail step. */
  submitQuickAdd: (food: LoggableFood, meal: MealSlotType) => Promise<void>;
  remove: () => Promise<void>;
}
