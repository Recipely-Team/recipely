import { ErrorMessageKey, type Failure } from '@core/failure';
import { failureContent } from '@presentation/base/errors/failure-lookups';
import type { FailureContent } from '@presentation/base/errors/failure-content';
import { t } from '@presentation/i18n';

/**
 * The failure face's copy. Same as everywhere (`failureContent`), except a
 * server with no AI provider reads as "meal reading is unavailable" here —
 * that key is deliberately unmapped app-wide, where it means other features.
 */
export const mealFailureContent = (failure: Failure): FailureContent => {
  if (failure.messageKey !== ErrorMessageKey.aiProviderNotConfigured) return failureContent(failure);
  const unavailable = t().errors.mealParseUnavailable;
  return { title: unavailable.title, body: unavailable.body };
};
