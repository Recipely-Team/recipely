import { ErrorMessageKey, FailureCode, type Failure } from '@core/failure';
import { MealFailureAction, type MealFailureActionType } from '@presentation/base/widgets/diary/add-food/meal/state/meal-failure-action';

const BY_KEY: Readonly<Record<string, MealFailureActionType>> = {
  [ErrorMessageKey.mealParseQuotaExceeded]: MealFailureAction.None,
  [ErrorMessageKey.mealParseUnavailable]: MealFailureAction.None,
  [ErrorMessageKey.aiProviderNotConfigured]: MealFailureAction.None,
  [ErrorMessageKey.mealParsePhotoUnchecked]: MealFailureAction.Retry,
  [ErrorMessageKey.aiCooldown]: MealFailureAction.Retry,
};

/** The failure face's one action: by the backend key first, then a validation failure means "change the input". */
export const mealFailureActionFor = (failure: Failure): MealFailureActionType => {
  const byKey = failure.messageKey === undefined ? undefined : BY_KEY[failure.messageKey];
  if (byKey !== undefined) return byKey;
  return failure.code === FailureCode.Validation ? MealFailureAction.Edit : MealFailureAction.Retry;
};
