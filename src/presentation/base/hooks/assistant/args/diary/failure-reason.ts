import type { Failure } from '@core/failure';

/**
 * A failed write as the model reads it: the backend's message key when there
 * is one (`errors.validation.nutrient_invalid`), else the failure's code
 * (`network`) — never the user-facing sentence, which is in the user's language.
 */
export const failureReason = (failure: Failure): string => failure.messageKey ?? failure.code;
