import { useRef, useState } from 'react';
import { type Href, useRouter } from 'expo-router';
import type { ChatMessage } from '@domain/drafts/chat-message';
import type { DraftRecipeSnapshot } from '@domain/drafts/draft-recipe-snapshot';
import type { DraftsStore } from '@application/drafts/drafts-store-contract';
import { useStores } from '@presentation/bootstrap/use-stores';
import { useLeaveGuard } from '@presentation/base/hooks/navigation/use-leave-guard';
import { useGoBackOrHome } from '@presentation/base/hooks/navigation/use-go-back-or-home';
import { RoutePaths } from '@presentation/base/constants';
import { editableHasContent } from '@presentation/app/create-recipe/model/drafting/editable-has-content';
import { editableToSnapshot } from '@presentation/app/create-recipe/model/drafting/editable-to-snapshot';
import type { EditableRecipe } from '@presentation/app/create-recipe/model/drafting/editable-recipe';
import { PhaseType } from '@presentation/app/create-recipe/model/phase-type';

/** What the editor holds, as far as leaving it is concerned. */
interface CreateExitArgs {
  phase: PhaseType;
  recipe: EditableRecipe;
  carried: DraftRecipeSnapshot | undefined;
  /** The draft exactly as this screen adopted it, or null for one started here. */
  openedAs: string | null;
  editRecipeId: string | undefined;
  activeDraftId: string;
  originalPrompt: string;
  chatHistory: ChatMessage[];
  upsertDraft: DraftsStore['upsertDraft'];
  cancelAutosave: () => void;
}

/**
 * Leaving the editor: asked about only when there is work the drafts list does not hold.
 *
 * @remarks
 * - **Opening an existing draft and leaving wrote nothing**, so there is
 *   nothing to ask about; a draft identical to the one opened leaves at once.
 * - **Editing a saved recipe asks about ANY change** — clearing a field is one
 *   too — and leaving unchanged just goes; the screen routes "save" to PATCH.
 * - **The question can come with an errand.** Asked for a new recipe with a
 *   draft open, the assistant used to answer that the draft would be lost and
 *   stop there. The question now comes with the request, on screen, and
 *   whichever answer it gets, the thing the user asked for still happens.
 * - **The system's own back** (Android back, iOS swipe) asks the same question
 *   as the close button.
 * - **Discard cancels autosave before deleting**, or a pending save re-creates
 *   the draft.
 */
export const useCreateExit = (args: CreateExitArgs) => {
  const { phase, recipe, carried, openedAs, editRecipeId, activeDraftId, originalPrompt, chatHistory, upsertDraft, cancelAutosave } = args;
  const router = useRouter();
  const goBackOrHome = useGoBackOrHome();
  const { draftsStore } = useStores();
  const [isExitOpen, setExitOpen] = useState(false);
  const afterExit = useRef<(() => void) | null>(null);

  const isUnchanged = openedAs !== null && openedAs === JSON.stringify(editableToSnapshot(recipe, carried));
  const hasUnkeptWork =
    phase === PhaseType.Preview && (editRecipeId !== undefined ? !isUnchanged : editableHasContent(recipe) && !isUnchanged);

  const leaveFor = (next: () => void): boolean => {
    if (!hasUnkeptWork) {
      next();
      return false;
    }
    afterExit.current = next;
    setExitOpen(true);
    return true;
  };

  useLeaveGuard(hasUnkeptWork, (release) => {
    afterExit.current = release;
    setExitOpen(true);
  });

  /** Either the errand the user was on, or the plain way out. */
  const leave = (): void => {
    const next = afterExit.current;
    afterExit.current = null;
    if (next === null) goBackOrHome();
    else next();
  };

  return {
    isExitOpen,
    onClose: (): boolean => leaveFor(goBackOrHome),
    onGenerateAnother: (wanted: string): boolean =>
      leaveFor(() => router.replace(RoutePaths.createRecipeWithPrompt(wanted) as Href)),
    onSaveDraftAndExit: async (): Promise<void> => {
      await upsertDraft({ id: activeDraftId, prompt: originalPrompt, snapshot: editableToSnapshot(recipe, carried), chatHistory });
      setExitOpen(false);
      leave();
    },
    onDiscardAndExit: async (): Promise<void> => {
      cancelAutosave();
      // Best-effort: a failed delete leaves the draft in My Recipes.
      if (editRecipeId === undefined) await draftsStore.getState().deleteDraft(activeDraftId);
      setExitOpen(false);
      leave();
    },
    // Keep editing: neither choice, so the pending errand is dropped.
    onKeepEditing: (): void => {
      afterExit.current = null;
      setExitOpen(false);
    },
  };
};
