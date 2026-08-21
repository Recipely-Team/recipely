import { AssistantAction, type AssistantActionType } from '@domain/assistant/actions/assistant-action-type';

/**
 * Narrows a word the model chose to one the app declares.
 *
 * The enum is sent to the model by the backend, so a deploy there can teach it
 * a word this build has never heard: an unrecognised action is a normal answer
 * to give, not a bug to guard against. It lives here rather than inside the
 * registry because the store asks the same question — the registry answers a
 * call, the transcript records which action ran.
 */
export function isAssistantAction(action: string): action is AssistantActionType {
  return (Object.values(AssistantAction) as string[]).includes(action);
}
