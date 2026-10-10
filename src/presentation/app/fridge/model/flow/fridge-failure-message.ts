import type { Failure } from '@core/failure';
import { FailureCode } from '@core/failure/failure-code';
import { failureContent } from '@presentation/base/errors/failure-lookups';
import { t } from '@presentation/i18n';

/**
 * The banner a failed scan or ideas request leaves on the step: offline reads
 * as the flow's own "your photos are kept"; anything else as its catalogue body.
 */
export const fridgeFailureMessage = (failure: Failure): string =>
  failure.code === FailureCode.Network ? t().fridge.offline : failureContent(failure).body;
