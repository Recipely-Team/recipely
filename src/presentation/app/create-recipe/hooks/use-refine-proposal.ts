import { useCallback, useEffect, useRef, useState } from 'react';
import { ChatRole } from '@domain/drafts/chat-role';
import { StoreStatus } from '@application/store/store-status';
import { useStores } from '@presentation/bootstrap/use-stores';
import { t } from '@presentation/i18n';
import { showErrorToast, showSuccessToast } from '@presentation/base/feedback/show-toast';
import { failureKeyMessage } from '@presentation/base/errors/failure-lookups';
import { editableToSnapshot } from '@presentation/app/create-recipe/model/drafting/editable-to-snapshot';
import { recipeToEditable } from '@presentation/app/create-recipe/model/drafting/recipe-to-editable';
import { buildRefineReply } from '@presentation/app/create-recipe/model/generation/build-refine-reply';
import { diffEditableRecipes } from '@presentation/app/create-recipe/model/refine/diff-editable-recipes';
import { ValueConstants } from '@core/constants';

import type { Dispatch, SetStateAction } from 'react';
import type { ChatMessage } from '@domain/drafts/chat-message';
import type { EditableRecipe } from '@presentation/app/create-recipe/model/drafting/editable-recipe';
import type { RefineProposal } from '@presentation/app/create-recipe/model/refine/refine-proposal';

/** `Array#indexOf`'s "no such element", named so the guard below reads. */
const NOT_FOUND = -1;

interface UseRefineProposalArgs {
  recipe: EditableRecipe;
  setRecipe: Dispatch<SetStateAction<EditableRecipe>>;
  chatHistory: ChatMessage[];
  setChatHistory: Dispatch<SetStateAction<ChatMessage[]>>;
  chatExpanded: boolean;
  refining: boolean;
}

/**
 * Runs a refinement as a PROPOSAL the cook accepts or declines, instead of an
 * edit that has already happened.
 *
 * @remarks
 * - **Nothing is applied until accept.** A vague instruction used to rewrite
 *   the recipe on arrival with no way back; holding the answer turns the
 *   accept/decline step into an undo boundary that costs nothing to build.
 * - **Declining is recorded, not forgotten.** The assistant turn is marked
 *   `rejected`, which rides back to the backend on the next instruction —
 *   otherwise a summary of a change that never landed reads, on replay, as an
 *   account of the recipe.
 * - **Asking again supersedes a pending proposal.** The new instruction is
 *   answered against the recipe as it stands, which is the un-accepted one, so
 *   leaving the old proposal on screen would offer to apply an answer to a
 *   question that has moved on. It is declined for the same reason it would be
 *   by hand.
 * - **History excludes the instruction being sent.** The backend takes that
 *   separately; including it here would show the model the same sentence twice.
 * - **An answer identical to the recipe is not a proposal.** There is nothing
 *   to accept, so the assistant simply says so and no card appears.
 */
export const useRefineProposal = ({
  recipe,
  setRecipe,
  chatHistory,
  setChatHistory,
  chatExpanded,
  refining,
}: UseRefineProposalArgs) => {
  const { createdRecipesStore } = useStores();
  const [proposal, setProposal] = useState<RefineProposal | null>(null);
  // A refine outlives the screen, so its "there is a decision waiting" toast
  // must not pop over whatever the user moved on to.
  const mounted = useRef(true);
  useEffect(() => () => { mounted.current = false; }, []);

  /** Marks the newest assistant turn as declined, leaving the rest untouched. */
  const markLastAssistantRejected = useCallback((): void => {
    setChatHistory((h) => {
      let last = NOT_FOUND;
      h.forEach((m, i) => {
        if (m.role === ChatRole.Assistant) last = i;
      });
      if (last === NOT_FOUND) return h;
      return h.map((m, i) => (i === last ? { ...m, rejected: true } : m));
    });
  }, [setChatHistory]);

  const onSubmit = useCallback(
    async (instruction: string): Promise<void> => {
      const trimmed = instruction.trim();
      if (trimmed.length === ValueConstants.zero || refining) return;

      if (proposal !== null) {
        setProposal(null);
        markLastAssistantRejected();
      }

      const priorTurns = [...chatHistory];
      setChatHistory((h) => [...h, { role: ChatRole.User, content: trimmed }]);

      const refined = await createdRecipesStore
        .getState()
        .refineRecipe(editableToSnapshot(recipe), trimmed, priorTurns);

      if (refined !== null) {
        const proposed = recipeToEditable(refined.recipe, recipe.media);
        const changes = diffEditableRecipes(recipe, proposed);
        const reply = buildRefineReply(refined, t().createRecipe.aiUpdated);
        setChatHistory((h) => [...h, { role: ChatRole.Assistant, content: reply }]);
        if (changes.length > ValueConstants.zero) {
          setProposal({ recipe: proposed, changes, reply });
          // The answer landed with the assistant closed: there is now a decision
          // waiting behind a panel the cook cannot see. Say it out loud.
          if (!chatExpanded && mounted.current) showSuccessToast(t().createRecipe.proposalWaiting);
        }
        createdRecipesStore.getState().resetRefineState();
        return;
      }

      // `refineRecipe` collapses its failure to `null`, so the reason is read back
      // off the store. Refine hits the same endpoint and the same prompt moderator
      // as generate, so it needs the same disambiguation: a refused instruction
      // must not read like an unusable AI response.
      const state = createdRecipesStore.getState().refineState;
      if (state.status === StoreStatus.Error) showErrorToast(state.failure);
      const reason = state.status === StoreStatus.Error ? failureKeyMessage(state.failure) : undefined;
      setChatHistory((h) => [
        ...h,
        { role: ChatRole.Assistant, content: reason ?? t().createRecipe.aiError, error: true },
      ]);
      createdRecipesStore.getState().resetRefineState();
    },
    [createdRecipesStore, recipe, refining, chatExpanded, chatHistory, proposal, markLastAssistantRejected, setChatHistory],
  );

  const onAccept = useCallback((): void => {
    if (proposal === null) return;
    setRecipe(proposal.recipe);
    setProposal(null);
  }, [proposal, setRecipe]);

  const onReject = useCallback((): void => {
    if (proposal === null) return;
    setProposal(null);
    markLastAssistantRejected();
  }, [proposal, markLastAssistantRejected]);

  return {
    proposal,
    onSubmitRefine: (instruction: string) => void onSubmit(instruction),
    onAcceptProposal: onAccept,
    onRejectProposal: onReject,
  };
};
