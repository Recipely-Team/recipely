import { AssistantAction, type AssistantActionType } from '@domain/assistant/actions/assistant-action-type';
import { isAssistantAction } from '@domain/assistant/actions/is-assistant-action';

/** Words that answer a sheet on screen, which nothing outside the app can see. */
const REFUSED_FROM_THE_OS: readonly AssistantActionType[] = [
  AssistantAction.Confirm,
  AssistantAction.Cancel,
];

/**
 * Narrows a word that arrived from outside the app — Siri, a launcher shortcut,
 * a deep link — to one the app will run for it.
 *
 * @remarks
 * - **A confirmation is an answer to a sheet the user can see.** A Siri turn
 *   has no view of the screen, and `/assistant/message` is stateless, so a
 *   model-chosen `confirm` could complete a destructive action left pending
 *   in a backgrounded app — on iOS 26 with no tap in between. A deep link is
 *   worse: any app on the phone can fire `recipely://assistant/run?action=confirm`.
 * - **Refused at both boundaries, by one predicate.** The Android link parser
 *   and the iOS queue bridge each ask this rather than `isAssistantAction`, so a
 *   refused word is dropped exactly where an unknown one is.
 */
export function isOsReachableAction(action: string): action is AssistantActionType {
  return isAssistantAction(action) && !REFUSED_FROM_THE_OS.includes(action);
}
