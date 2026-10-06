import type { CalendarDate } from '@domain/diary/calendar/calendar-date';
import type { LoggableFood } from '@domain/diary/entry/loggable-food';
import type { Servings } from '@domain/diary/entry/servings';
import type { MealSlotType } from '@domain/diary/meal-slot';
import type { FoodProduct } from '@domain/diary/foods/product/food-product';
import type { RecentFoodType } from '@domain/diary/foods/search/recent-food';
import type { FoodUnit } from '@domain/diary/foods/units/food-unit';
import type { AddFoodStepType } from '@presentation/base/widgets/diary/add-food/state/add-food-step';
import type { ProductStepModelType } from '@presentation/base/widgets/diary/add-food/state/product/product-step-model';

/** The Add food sheet's state and intents, as `useAddFoodFlow` exposes them. */
export interface AddFoodFlow {
  date: CalendarDate;
  step: AddFoodStepType;
  meal: MealSlotType;
  isEdit: boolean;
  /** True when the step was reached from the pick step, so "back" has somewhere to go. */
  canGoBack: boolean;
  isSubmitting: boolean;
  /** The recipe, recent food or quick add on the detail step; null on the other steps. */
  food: LoggableFood | null;
  servings: Servings;
  /** The product step; null on the other steps. */
  product: ProductStepModelType | null;
  /** Kcal of the chosen amount, for the footer; null when there is nothing to add yet. */
  footerCalories: number | null;
  choose: (food: LoggableFood) => void;
  chooseProduct: (row: FoodProduct) => void;
  chooseRecent: (recent: RecentFoodType) => void;
  back: () => void;
  increment: () => void;
  decrement: () => void;
  setMeal: (meal: MealSlotType) => void;
  setVariant: (index: number) => void;
  setUnit: (unit: FoodUnit) => void;
  incrementAmount: () => void;
  decrementAmount: () => void;
  /** Asks for the listed product's variants again after a failure. */
  retryProduct: () => void;
  /** Adds (or saves the edit); closes and toasts on success. */
  submit: () => Promise<void>;
  /** Logs a quick add straight away, skipping the detail step. */
  submitQuickAdd: (food: LoggableFood, meal: MealSlotType) => Promise<void>;
  remove: () => Promise<void>;
}
