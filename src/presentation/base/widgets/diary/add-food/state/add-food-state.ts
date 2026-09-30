import type { CalendarDate } from '@domain/diary/calendar/calendar-date';
import type { LoggableFood } from '@domain/diary/entry/loggable-food';
import type { Servings } from '@domain/diary/entry/servings';
import type { MealSlotType } from '@domain/diary/meal-slot';
import type { AddFoodStepType } from '@presentation/base/widgets/diary/add-food/state/add-food-step';

/** The Add food sheet's own state — reset whenever a new request opens it. */
export interface AddFoodState {
  /** The day the food is logged to; an edit keeps its entry's day. */
  date: CalendarDate;
  step: AddFoodStepType;
  food: LoggableFood | null;
  servings: Servings;
  meal: MealSlotType;
  canGoBack: boolean;
}
