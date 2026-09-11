import type { AssistantFailureCodeType } from './failure-code';

/**
 * A failed assistant operation.
 *
 * `detail` is diagnostic text for logs, never for a user. `cause` is whatever
 * the app's own code threw or returned (a `getConnection` refusal, say), handed
 * back untouched so the app can tell its own reasons apart.
 */
export interface AssistantFailure {
  readonly code: AssistantFailureCodeType;
  readonly detail?: string;
  readonly cause?: unknown;
}
