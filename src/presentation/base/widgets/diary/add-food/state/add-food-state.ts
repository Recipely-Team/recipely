import type { CalendarDate } from '@domain/diary/calendar/calendar-date';
import type { LoggableFood } from '@domain/diary/entry/loggable-food';
import type { Servings } from '@domain/diary/entry/servings';
import type { MealSlotType } from '@domain/diary/meal-slot';
import type { FoodQuantity } from '@domain/diary/foods/units/food-quantity';
import type { AddFoodStep } from '@presentation/base/widgets/diary/add-food/state/add-food-step';
import type { ProductChoiceType } from '@presentation/base/widgets/diary/add-food/state/product/product-choice';

/** What every step shares. */
interface AddFoodBase {
  /** The day the food is logged to; an edit keeps its entry's day. */
  date: CalendarDate;
  meal: MealSlotType;
  /** True when the step was reached from the pick step, so "back" has somewhere to go. */
  canGoBack: boolean;
}

/**
 * The Add food sheet's own state — reset whenever a new request opens it. The
 * product step's `variantIndex` / `quantity` are null until the user changes
 * them: the defaults belong to the product, which may still be loading.
 */
export type AddFoodState = AddFoodBase &
  (
    | { step: typeof AddFoodStep.Pick }
    | { step: typeof AddFoodStep.Detail; food: LoggableFood; servings: Servings }
    | { step: typeof AddFoodStep.Product; choice: ProductChoiceType; variantIndex: number | null; quantity: FoodQuantity | null }
  );
