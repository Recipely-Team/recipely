import { AssistantStatus, type AssistantStatusType } from '@application/assistant/session/assistant-status';

/**
 * Whether there is a session to mute, end, or minimise into the mini bar.
 *
 * @remarks
 * Spelled `status !== Idle` at three call sites, it counted `Unavailable` as
 * live — so a refused or unreachable session showed a green dot and offered
 * Mute and End for something that did not exist, with no way back to the
 * button that starts one. Whichever way a session fails to begin, the assistant
 * is not in one.
 *
 * `Connecting` IS live: the socket is being established and the user must be
 * able to abandon it, which is the one thing they cannot do if the only
 * control on screen is the one that starts a session.
 */
export function assistantIsLive(status: AssistantStatusType): boolean {
  return status !== AssistantStatus.Idle && status !== AssistantStatus.Unavailable;
}
