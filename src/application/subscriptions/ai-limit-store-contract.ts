import type { AiUsageLimit } from '@domain/subscriptions/ai-usage-limit';

export interface AiLimitStore {
  /** The cap that refused the latest AI request, while its dialog is up; null otherwise. */
  limit: AiUsageLimit | null;
  /** Raises the dialog; a second refusal while it is up changes nothing (never stacks). */
  report: (limit: AiUsageLimit) => void;
  /** Closes the dialog ("Got it", Upgrade, the scrim or back). */
  dismiss: () => void;
}
