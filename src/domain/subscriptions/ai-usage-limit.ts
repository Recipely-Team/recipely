import type { AiLimitScope } from '@domain/subscriptions/ai-limit-scope';

/**
 * The free plan's AI cap as the backend reported it when it refused a request.
 *
 * @remarks
 * - **The server's numbers, never the device's.** `resetsAt` is the server's
 *   reset time; the app formats it but does not compute it.
 */
export interface AiUsageLimit {
  readonly scope: (typeof AiLimitScope)[keyof typeof AiLimitScope];
  readonly limit: number;
  readonly used: number;
  readonly resetsAt: Date;
}
