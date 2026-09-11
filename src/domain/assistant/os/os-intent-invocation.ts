import type { AssistantActionType } from '@domain/assistant/actions/assistant-action-type';
import type { OsIntentIdType } from '@domain/assistant/os/os-intent-id';

/**
 * A request the OS assistant made, narrowed to words this build understands.
 *
 * @remarks
 * - **The native side speaks strings; this does not.** An intent may have been
 *   compiled into a build older or newer than the JavaScript reading it, so the
 *   bridge hands over a bare string and the adapter drops what
 *   `isOsReachableAction` refuses. A word this build cannot run is
 *   dropped at the boundary rather than dispatched and failed.
 * - **`at` is what makes a stale request discardable** — `isStaleInvocation`.
 *   A search arriving after the user has moved on is worse than nothing
 *   happening.
 */
export interface OsIntentInvocation {
  readonly id: OsIntentIdType;
  /** Identity within the queue, so a dispatched request can be acknowledged. */
  readonly invocationId: string;
  readonly action: AssistantActionType | null;
  readonly arg: string | null;
  readonly at: number;
}
