import { defaultMealForHour } from '@domain/diary/entry/default-meal-for-hour';
import { Servings } from '@domain/diary/entry/servings';
import { AddFoodRequestKind } from '@presentation/base/widgets/diary/add-food/request/add-food-request-kind';
import type { AddFoodRequest } from '@presentation/base/widgets/diary/add-food/request/add-food-request';
import type { AddFoodState } from '@presentation/base/widgets/diary/add-food/state/add-food-state';
import { AddFoodStep } from '@presentation/base/widgets/diary/add-food/state/add-food-step';
import { requestDate } from '@presentation/base/widgets/diary/add-food/state/request-date';

/**
 * Where a request opens the sheet: the pick step from the diary, the detail
 * step with a food chosen elsewhere, or the detail step pre-filled from an
 * entry. `now` is the clock the default meal is read from (design spec §3).
 */
export const initialAddFoodState = (request: AddFoodRequest, now: Date): AddFoodState => {
  const date = requestDate(request);
  switch (request.kind) {
    case AddFoodRequestKind.Edit:
      return {
        date,
        step: AddFoodStep.Detail,
        food: request.entry.food,
        servings: Servings.nearest(request.entry.servings),
        meal: request.entry.meal,
        canGoBack: false,
      };
    case AddFoodRequestKind.Food:
      return {
        date,
        step: AddFoodStep.Detail,
        food: request.food,
        servings: Servings.one(),
        meal: request.meal ?? defaultMealForHour(now.getHours()),
        canGoBack: false,
      };
    case AddFoodRequestKind.Pick:
      return {
        date,
        step: AddFoodStep.Pick,
        food: null,
        servings: Servings.one(),
        meal: request.meal ?? defaultMealForHour(now.getHours()),
        canGoBack: false,
      };
  }
};
