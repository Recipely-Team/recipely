import type { AssistantDenialReasonType } from '@domain/assistant/session/assistant-denial-reason';
import type { AssistantGrantStatus } from '@domain/assistant/session/assistant-grant-status';
import type { LiveSessionCredentials } from '@domain/assistant/session/live-session-credentials';

/**
 * The server's answer to "may I speak?", as a union rather than a bag of
 * optional fields.
 *
 * The wire shape has `token` and `reason` both optional, which permits three
 * states that cannot happen — a grant with no credentials, a denial with
 * credentials, and an answer that is neither. Narrowing at the mapper means no
 * screen ever writes `if (token !== undefined)` and then has to decide what a
 * missing `reason` meant.
 */
export type AssistantSessionGrantType =
  | {
      readonly status: typeof AssistantGrantStatus.Granted;
      readonly credentials: LiveSessionCredentials;
      readonly remainingSeconds: number;
    }
  | {
      readonly status: typeof AssistantGrantStatus.Denied;
      readonly reason: AssistantDenialReasonType;
      readonly remainingSeconds: number;
    };
