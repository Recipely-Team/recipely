import type { AssistantFailureCodeType } from './failure-code';

/** A failed assistant operation. `detail` is for logs only, never for a user. */
export interface AssistantFailure {
  readonly code: AssistantFailureCodeType;
  readonly detail?: string;
}
