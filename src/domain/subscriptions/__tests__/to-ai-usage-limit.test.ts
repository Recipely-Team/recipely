import { ErrorMessageKey, RateLimitFailure, ServerFailure } from '@core/failure';
import { toAiUsageLimit } from '@domain/subscriptions/to-ai-usage-limit';

const capped = (details?: Record<string, unknown>) => new RateLimitFailure('limit', undefined, ErrorMessageKey.aiUsageLimit, details);

describe('toAiUsageLimit', () => {
  it('reads the scope, counts and reset time of the AI cap', () => {
    expect(toAiUsageLimit(capped({ scope: 'monthly', limit: 2000, used: 2000, resetsAt: '2026-12-01T00:00:00.000Z' }))).toEqual({
      scope: 'monthly', limit: 2000, used: 2000, resetsAt: new Date('2026-12-01T00:00:00.000Z'),
    });
  });

  it('is null for other failures and for details it cannot trust', () => {
    expect(toAiUsageLimit(new ServerFailure('boom'))).toBeNull();
    expect(toAiUsageLimit(new RateLimitFailure('slow', undefined, ErrorMessageKey.aiCooldown, { scope: 'daily' }))).toBeNull();
    expect(toAiUsageLimit(capped())).toBeNull();
    expect(toAiUsageLimit(capped({ scope: 'weekly', limit: 1, used: 1, resetsAt: '2026-12-01T00:00:00.000Z' }))).toBeNull();
    expect(toAiUsageLimit(capped({ scope: 'daily', limit: 200, used: 200, resetsAt: 'soon' }))).toBeNull();
  });
});
