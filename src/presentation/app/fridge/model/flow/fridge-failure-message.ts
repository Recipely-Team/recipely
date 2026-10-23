import type { TranslationsType } from '@presentation/i18n';
import type { Failure } from '@core/failure';
import { FailureCode } from '@core/failure/failure-code';
import { failureContent } from '@presentation/base/errors/failure-lookups';

/**
 * The banner a failed scan or ideas request leaves on the step: offline reads
 * as the flow's own "your photos are kept"; anything else as its catalogue body.
 */
export const fridgeFailureMessage = (t: TranslationsType, failure: Failure): string =>
  failure.code === FailureCode.Network ? t.fridge.offline : failureContent(t, failure).body;
