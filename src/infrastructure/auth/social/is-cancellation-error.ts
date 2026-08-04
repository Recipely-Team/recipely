import { hasKey, isString } from '@core/guards/type-guards';
import { CancellationCode } from '@infrastructure/auth/social/cancellation-code';

const CANCELLATION_CODES: readonly string[] = Object.values(CancellationCode);

/**
 * True when a thrown sign-in error is the SDK reporting that the user closed
 * the sheet or popup, rather than anything failing.
 *
 * Both SDKs reject with a plain object carrying `code`, so the shape is checked
 * before it is read — `error` here is whatever a `catch` was handed.
 */
export const isCancellationError = (error: unknown): boolean =>
  hasKey(error, 'code') && isString(error.code) && CANCELLATION_CODES.includes(error.code);
