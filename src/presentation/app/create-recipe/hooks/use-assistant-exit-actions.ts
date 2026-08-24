import { useCallback } from 'react';
import { AssistantAction } from '@domain/assistant/actions/assistant-action-type';
import type { AssistantActionResultType } from '@domain/assistant/actions/assistant-action-result';
import { useAssistantAction } from '@presentation/base/hooks/assistant/actions/use-assistant-action';
import { useAssistantConfirmation } from '@presentation/base/hooks/assistant/actions/use-assistant-confirmation';

/** Leaving the create flow, as the screen itself performs it. */
interface AssistantExitActionsDeps {
  /**
   * Whether the exit sheet is the thing the user is looking at.
   *
   * Nothing else may be drawn over it: a spoken answer read against a photo
   * picker or an error dialog would be given to the sheet behind them.
   */
  isExitPending: boolean;
  /** The close button's own handler; true when it opened the sheet instead of leaving. */
  onClose: () => boolean;
  onSaveDraftAndExit: () => void;
  onDiscardAndExit: () => void;
}

/**
 * Lets the assistant leave the draft the way a person does.
 *
 * @remarks
 * - **`goBack` presses the screen's close button, not the router's back.** The
 *   global handler calls `router.back()`, which walks straight past the
 *   question this screen asks about unpublished work — so "çık" left the
 *   editor with the autosaved draft still sitting in My Recipes, and the user
 *   who had just said they did not want it saved watched it be saved. The
 *   innermost registration wins while this screen is mounted, which is exactly
 *   the case where back means something more than popping a route.
 * - **It answers `awaiting` when it asked.** A sheet opened and reported as a
 *   clean exit leaves the model announcing it left while the user reads a
 *   question nobody told them to answer.
 * - **The sheet's three answers, in the user's words.** "Keep this draft?" is
 *   answered yes by `confirm` and by `save` — both save it to drafts and
 *   leave — and no by `cancel`, which discards it. Discarding deletes work, so
 *   it is deliberately only reachable while the sheet with the discard button
 *   on it is in front of the user: the same loop as the tap, with a different
 *   limb, and out of reach at every other moment.
 */
export const useAssistantExitActions = (deps: AssistantExitActionsDeps): void => {
  const { isExitPending, onClose, onSaveDraftAndExit, onDiscardAndExit } = deps;

  useAssistantAction(
    AssistantAction.GoBack,
    useCallback(async (): Promise<AssistantActionResultType> => {
      const asked = onClose();
      return asked ? { ok: true, awaiting: true } : { ok: true };
    }, [onClose]),
  );

  useAssistantAction(
    AssistantAction.Save,
    useCallback(async (): Promise<AssistantActionResultType> => {
      onSaveDraftAndExit();
      return { ok: true };
    }, [onSaveDraftAndExit]),
    isExitPending,
  );

  useAssistantConfirmation(isExitPending, onSaveDraftAndExit, onDiscardAndExit);
};
