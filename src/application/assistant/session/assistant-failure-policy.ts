import { AssistantFailureCode } from '@live-assistant/core';
import type { AssistantFailure } from '@live-assistant/core';
import { toAppFailure } from '@application/assistant/session/to-app-failure';
import type { AssistantSessionStoreState } from '@application/assistant/session/assistant-session-store-state';
import { AssistantDenialReason } from '@domain/assistant/session/assistant-denial-reason';
import type { AssistantDenialReasonType } from '@domain/assistant/session/assistant-denial-reason';
import { Failure } from '@core/failure/failure';

/** A Denied grant, thrown out of `getConnection` so it comes back as the failure's `cause`. */
class GrantRefusal {
  constructor(
    readonly reason: AssistantDenialReasonType,
    readonly remainingSeconds: number,
  ) {}
}

/** What a refused start writes to the store, beside the `Unavailable` pill. */
type StartDenialPatch = Partial<Pick<AssistantSessionStoreState, 'deniedReason' | 'remainingSeconds' | 'isUnlimited'>>;

/**
 * **Assistant failure policy** — which `@live-assistant/*` failures the user is
 * shown as an error, and which are a refusal the pill already explains.
 *
 * @remarks
 * - **Refusals are reasons, not errors.** A refused microphone or a Denied
 *   grant leave `Unavailable` and a `deniedReason`; neither raises an error.
 * - **A dropped socket is quiet**: the old store tore it down without a word;
 *   the pill going idle is the notice.
 * - **A backend failure while minting** is surfaced as itself, not as the
 *   library's generic "connection refused", and also leaves `Unavailable`.
 */
export const AssistantFailurePolicy = {
  /** The value `getConnection` throws for a Denied grant. */
  refusal: (reason: AssistantDenialReasonType, remainingSeconds: number): GrantRefusal =>
    new GrantRefusal(reason, remainingSeconds),

  /** A session failure in the app's words — or none, for what the pill already explains. */
  toSessionError: (failure: AssistantFailure | null): Failure | null => {
    if (failure === null) return null;
    if (failure.code === AssistantFailureCode.MicrophoneDenied) return null;
    if (failure.code === AssistantFailureCode.ConnectionLost) return null;
    if (failure.code === AssistantFailureCode.ConnectionRefused) {
      if (failure.cause instanceof GrantRefusal) return null;
      if (failure.cause instanceof Failure) return failure.cause;
    }
    return toAppFailure(failure);
  },

  /**
   * What a failed start leaves beside an `Unavailable` pill — or `null` when it
   * was no refusal and the pill is left to the session's own status.
   */
  toStartDenial: (failure: AssistantFailure): StartDenialPatch | null => {
    if (failure.code === AssistantFailureCode.MicrophoneDenied) {
      return { deniedReason: AssistantDenialReason.MicrophoneDenied };
    }
    if (failure.code !== AssistantFailureCode.ConnectionRefused) return null;
    if (failure.cause instanceof GrantRefusal) {
      return { deniedReason: failure.cause.reason, remainingSeconds: failure.cause.remainingSeconds, isUnlimited: false };
    }
    return failure.cause instanceof Failure ? {} : null;
  },
} as const;
