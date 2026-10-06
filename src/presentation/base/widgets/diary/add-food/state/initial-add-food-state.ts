import { defaultMealForHour } from '@domain/diary/entry/default-meal-for-hour';
import { Servings } from '@domain/diary/entry/servings';
import { AddFoodRequestKind } from '@presentation/base/widgets/diary/add-food/request/add-food-request-kind';
import type { AddFoodRequestType } from '@presentation/base/widgets/diary/add-food/request/add-food-request';
import type { AddFoodState } from '@presentation/base/widgets/diary/add-food/state/add-food-state';
import { AddFoodStep } from '@presentation/base/widgets/diary/add-food/state/add-food-step';
import { ProductChoiceKind } from '@presentation/base/widgets/diary/add-food/state/product/product-choice-kind';
import { requestDate } from '@presentation/base/widgets/diary/add-food/state/request-date';

/**
 * Where a request opens the sheet: the pick step from the diary, the detail
 * step with a food chosen elsewhere, or — for an edit — the detail step (a
 * recipe or quick add) or the product step (a product entry), pre-filled
 * from the entry. `now` is the clock the default meal is read from.
 */
export const initialAddFoodState = (request: AddFoodRequestType, now: Date): AddFoodState => {
  const date = requestDate(request);
  switch (request.kind) {
    case AddFoodRequestKind.Edit: {
      const { entry } = request;
      const logged = entry.loggedProduct;
      if (logged !== null) {
        return {
          date,
          meal: entry.meal,
          canGoBack: false,
          step: AddFoodStep.Product,
          choice: { kind: ProductChoiceKind.Logged, product: logged.product, quantity: logged.quantity },
          variantIndex: null,
          quantity: null,
        };
      }
      return { date, meal: entry.meal, canGoBack: false, step: AddFoodStep.Detail, food: entry.food, servings: Servings.nearest(entry.servings) };
    }
    case AddFoodRequestKind.Food:
      return {
        date,
        meal: request.meal ?? defaultMealForHour(now.getHours()),
        canGoBack: false,
        step: AddFoodStep.Detail,
        food: request.food,
        servings: Servings.one(),
      };
    case AddFoodRequestKind.Pick:
      return { date, meal: request.meal ?? defaultMealForHour(now.getHours()), canGoBack: false, step: AddFoodStep.Pick };
  }
};
