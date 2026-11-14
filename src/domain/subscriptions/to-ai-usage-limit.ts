import { ErrorMessageKey, type Failure, RateLimitFailure } from '@core/failure';
import { isString } from '@core/guards/type-guards';
import { AiLimitScope } from '@domain/subscriptions/ai-limit-scope';
import type { AiUsageLimit } from '@domain/subscriptions/ai-usage-limit';

const SCOPES: readonly string[] = Object.values(AiLimitScope);
const isScope = (value: unknown): value is AiUsageLimit['scope'] => isString(value) && SCOPES.includes(value);
const isCount = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);

/**
 * The AI cap a failure reports, or null for any other failure — including a
 * limit refusal from an older backend that sent no usable details, which the
 * screens then show with the ordinary limit copy.
 */
export const toAiUsageLimit = (failure: Failure): AiUsageLimit | null => {
  if (!(failure instanceof RateLimitFailure) || failure.messageKey !== ErrorMessageKey.aiUsageLimit) return null;
  const details = failure.details;
  if (details === undefined) return null;
  const { scope, limit, used, resetsAt } = details;
  if (!isScope(scope) || !isCount(limit) || !isCount(used) || !isString(resetsAt)) return null;
  const resets = new Date(resetsAt);
  return Number.isNaN(resets.getTime()) ? null : { scope, limit, used, resetsAt: resets };
};
