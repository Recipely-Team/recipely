import type { AssistantActionType } from '@domain/assistant/actions/assistant-action-type';
import { t } from '@presentation/i18n';

/**
 * What the assistant just did, in the user's language.
 *
 * @remarks
 * - **The transcript line carries a key, not a sentence.** The store appends
 *   the action it ran; turning that into copy here is what keeps user-visible
 *   text inside i18n, where en and tr stay in step.
 * - **An unknown key falls back to a generic line rather than showing itself.**
 *   A new action reaching an older dictionary should read as "done" and not as
 *   `openSavedRecipes` — the chip is a receipt, and a raw identifier on it is
 *   worse than a vaguer truth.
 */
export function assistantActionLabel(action: AssistantActionType): string {
  return t().assistant.actions[action] ?? t().assistant.actionDone;
}
