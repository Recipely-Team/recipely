import { type Dispatch, type SetStateAction, useCallback, useEffect, useRef, useState } from 'react';
import { useStore } from 'zustand';
import { ChatRole } from '@domain/drafts/chat-role';
import { StoreStatus } from '@application/store/store-status';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useStores } from '@presentation/bootstrap/use-stores';
import { useTranslations } from '@presentation/i18n';
import { showDangerToast, showErrorToast } from '@presentation/base/feedback/show-toast';
import {
  failureKeyMessage,
  failureToastMessage,
} from '@presentation/base/errors/failure-lookups';
import { ValidationFailure } from '@core/failure';
import { useDraftAutosave } from '@presentation/app/create-recipe/hooks/session/use-draft-autosave';
import { useDraftResume } from '@presentation/app/create-recipe/hooks/session/use-draft-resume';
import { useEditableSeed } from '@presentation/app/create-recipe/hooks/session/use-editable-seed';
import { useGenerationTicker } from '@presentation/app/create-recipe/hooks/session/use-generation-ticker';
import { useCreateExit } from '@presentation/app/create-recipe/hooks/session/use-create-exit';
import { editableToSnapshot } from '@presentation/app/create-recipe/model/drafting/editable-to-snapshot';
import { emptyEditable } from '@presentation/app/create-recipe/model/drafting/empty-editable';
import { recipeToEditable } from '@presentation/app/create-recipe/model/drafting/recipe-to-editable';
import { snapshotToEditable } from '@presentation/app/create-recipe/model/drafting/snapshot-to-editable';
import { useRefineProposal } from '@presentation/app/create-recipe/hooks/session/use-refine-proposal';
import type { ChatMessage } from '@domain/drafts/chat-message';
import type { DraftRecipeSnapshot } from '@domain/drafts/draft-recipe-snapshot';
import { PhaseType } from '@presentation/app/create-recipe/model/phase-type';
import { CharConstants, ValueConstants } from '@core/constants';
import { RoutePaths } from '@presentation/base/constants';
import type { EditableRecipe } from '@presentation/app/create-recipe/model/drafting/editable-recipe';
import { importReviewOf } from '@presentation/app/create-recipe/model/review/import-review-of';

interface UseRecipeGenerationArgs {
  recipe: EditableRecipe;
  setRecipe: Dispatch<SetStateAction<EditableRecipe>>;
  activeDraftId: string;
  draftId: string | undefined;
  /** A saved private recipe being edited; no drafts, no generation. */
  editRecipeId: string | undefined;
}

/**
 * Owns the AI create flow: prompt → generate → preview → refine. Its parts:
 * `useDraftResume` (opening `?draftId=`), `useEditableSeed` (editing or copying
 * a recipe), `useDraftAutosave`, `useRefineProposal`, `useGenerationTicker`
 * and `useCreateExit` (leaving with unsaved work).
 *
 * @remarks
 * - **Where a failure can be shown decides how it is shown.** A generate
 *   failure lands back on the prompt phase, which renders no chat transcript,
 *   so it is surfaced as a toast AND kept inline under the input.
 * - **The backend names its errors** (`failure.messageKey`), so a refused
 *   prompt (rewording IS the fix) no longer reads the same as an unusable AI
 *   response (the prompt was fine, generate again) even though both arrive as
 *   `unprocessable` → `ValidationFailure`. `aiPromptFailed` survives only for a
 *   4xx with no key — an older backend, or a server key this build predates.
 * - **Resuming is its own phase.** Opening `?draftId=` has to fetch before it
 *   can show anything, and the phase it waits in is what the user sees — so it
 *   waits in `Resuming` (a skeleton of the editor), never in `Prompt`.
 * - **A refine outlives the screen**, so publishing or exiting to a draft while
 *   one is in flight must not pop its "Updated!" over whatever comes next.
 * - **Drafts round-trip through the same mapper the comparison uses**, or a
 *   draft that was only opened and closed would compare as changed by whatever
 *   the mapping normalises.
 */
export const useRecipeGeneration = ({
  recipe,
  setRecipe,
  activeDraftId,
  draftId,
  editRecipeId,
}: UseRecipeGenerationArgs) => {
  const t = useTranslations();
  const router = useRouter();
  const params = useLocalSearchParams<{ prompt?: string; fromRecipeId?: string }>();
  const promptParam = params.prompt;

  const { recipeAuthoringStore, draftsStore } = useStores();
  const refineState = useStore(recipeAuthoringStore, (s) => s.refineState);
  const latestDraft = useStore(draftsStore, (s) => s.latestDraft);
  const loadLatestDraft = useStore(draftsStore, (s) => s.loadLatestDraft);
  const upsertDraft = useStore(draftsStore, (s) => s.upsertDraft);

  // A draft opens in Resuming: it is fetched asynchronously.
  const [phase, setPhase] = useState<PhaseType>(
    draftId === undefined && editRecipeId === undefined ? PhaseType.Prompt : PhaseType.Resuming,
  );
  const [prompt, setPrompt] = useState(CharConstants.empty);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [originalPrompt, setOriginalPrompt] = useState(CharConstants.empty);

  // The assistant generates via ?prompt=; a ?draftId= being resumed wins.
  const startedFromParam = useRef(false);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState(CharConstants.empty);
  const [isChatExpanded, setChatExpanded] = useState(false);
  /**
   * The draft exactly as this screen adopted it, or null for one started here.
   * Leaving with the recipe still identical to it means there is nothing to
   * decide — see {@link onClose}.
   */
  const [openedAs, setOpenedAs] = useState<string | null>(null);
  /**
   * The snapshot this screen adopted, kept whole. The editor has no field for
   * an import's `category`, `tags`, `tips`, `nutrition` or cover, and autosave
   * fires on open — so without carrying the original forward, merely LOOKING at
   * an imported draft overwrote everything the AI had extracted.
   */
  const [carried, setCarried] = useState<DraftRecipeSnapshot | undefined>(undefined);

  const isRefining = refineState.status === StoreStatus.Refining;

  // router.replace changes the param on an already-mounted screen: that draft resumes too.
  const [resumingFor, setResumingFor] = useState(draftId);
  if (draftId !== resumingFor) {
    setResumingFor(draftId);
    if (draftId !== undefined) setPhase(PhaseType.Resuming);
  }

  useDraftResume(draftId, {
    onResumed: (draft) => {
      const resumed = snapshotToEditable(draft.snapshot);
      setCarried(draft.snapshot);
      setRecipe(resumed);
      setOpenedAs(JSON.stringify(editableToSnapshot(resumed, draft.snapshot)));
      setChatHistory([...draft.chatHistory]);
      setOriginalPrompt(draft.prompt);
      setPrompt(draft.prompt);
      setPhase(PhaseType.Preview);
    },
    onUnreadable: () => setPhase(PhaseType.Prompt),
  });

  // Surface a "Resume your draft" card on a fresh prompt phase.
  useEffect(() => {
    if (draftId === undefined && editRecipeId === undefined) void loadLatestDraft();
  }, [draftId, editRecipeId, loadLatestDraft]);

  useEditableSeed({
    editRecipeId,
    fromRecipeId: params.fromRecipeId,
    draftId,
    claimStart: () => {
      if (startedFromParam.current) return false;
      startedFromParam.current = true;
      return true;
    },
    onSeed: (seeded, opened) => {
      setRecipe(seeded);
      if (opened !== null) setOpenedAs(opened);
      setPhase(PhaseType.Preview);
    },
  });
  const genStep = useGenerationTicker(phase);

  const { cancel: cancelAutosave, flush: flushDraft } = useDraftAutosave({
    carried,
    enabled: phase === PhaseType.Preview && editRecipeId === undefined,
    draftId: activeDraftId,
    prompt: originalPrompt,
    recipe,
    chatHistory,
    upsertDraft,
  });

  const { proposal, onSubmitRefine, onAcceptProposal, onRejectProposal } = useRefineProposal({
    recipe,
    setRecipe,
    chatHistory,
    setChatHistory,
    chatExpanded: isChatExpanded,
    refining: isRefining,
  });

  const generation = useRef<number>(ValueConstants.zero);
  const onCancelGenerate = useCallback((): void => {
    generation.current += ValueConstants.one;
    recipeAuthoringStore.getState().resetGenerateState();
    setPhase(PhaseType.Prompt);
  }, [recipeAuthoringStore]);

  const runGenerate = useCallback(
    async (text: string): Promise<void> => {
      const trimmed = text.trim();
      if (trimmed.length === ValueConstants.zero) return;
      setOriginalPrompt(trimmed);
      setGenerateError(null);
      setPhase(PhaseType.Generating);
      generation.current += ValueConstants.one;
      const mine = generation.current;
      await recipeAuthoringStore.getState().generateRecipe(trimmed);
      // Cancelled while waiting: the answer is dropped, the prompt screen stays.
      if (mine !== generation.current) return;
      const state = recipeAuthoringStore.getState().generateState;
      if (state.status === StoreStatus.Success) {
        setRecipe((prev) => recipeToEditable(state.recipe, prev.media));
        setChatHistory([
          { role: ChatRole.User, content: trimmed },
          { role: ChatRole.Assistant, content: t.createRecipe.aiFirstReply },
        ]);
        recipeAuthoringStore.getState().resetGenerateState();
        setPhase(PhaseType.Preview);
        return;
      }
      if (state.status === StoreStatus.Error) {
        const { failure } = state;
        const isUnnamed4xx =
          failure instanceof ValidationFailure && failureKeyMessage(t, failure) === undefined;
        const message = isUnnamed4xx
          ? t.createRecipe.aiPromptFailed
          : failureToastMessage(t, failure);
        if (isUnnamed4xx) showDangerToast(message);
        else showErrorToast(failure);
        setGenerateError(message);
      }
      recipeAuthoringStore.getState().resetGenerateState();
      setPhase(PhaseType.Prompt);
    },
    [recipeAuthoringStore, setRecipe, t],
  );

  // Any prompt edit clears the stale error.
  useEffect(() => {
    if (promptParam === undefined || promptParam === CharConstants.empty) return;
    if (draftId !== undefined || editRecipeId !== undefined || startedFromParam.current) return;
    startedFromParam.current = true;
    setPrompt(promptParam);
    void runGenerate(promptParam);
  }, [promptParam, draftId, editRecipeId, runGenerate]);

  const onChangePrompt = (value: string): void => {
    setPrompt(value);
    setGenerateError(null);
  };
  const onAppendChip = (chip: string): void => {
    setPrompt((p) => (p.trim().length === ValueConstants.zero ? chip : `${p}, ${chip.toLowerCase()}`));
    setGenerateError(null);
  };
  const onStartBlank = (): void => {
    setRecipe(emptyEditable());
    setChatHistory([]);
    setOriginalPrompt(CharConstants.empty);
    setPhase(PhaseType.Preview);
  };
  const onResumeDraft = (): void => {
    if (latestDraft !== null) router.replace({ pathname: RoutePaths.createRecipe, params: { draftId: latestDraft.id } });
  };

  const exit = useCreateExit({
    phase,
    recipe,
    carried,
    openedAs,
    editRecipeId,
    activeDraftId,
    originalPrompt,
    chatHistory,
    upsertDraft,
    cancelAutosave,
  });

  return {
    importReview: importReviewOf(carried),
    flushDraft,
    stopAutosave: cancelAutosave,
    phase,
    genStep,
    refining: isRefining,
    prompt,
    generateError,
    onChangePrompt,
    onAppendChip,
    onGenerate: () => void runGenerate(prompt),
    onCancelGenerate,
    onStartBlank,
    onImportFromInstagram: () => router.push(RoutePaths.importRecipe),
    onImportFromFile: () => router.push(RoutePaths.importRecipeFromFile),
    onClose: exit.onClose,
    latestDraft,
    onResumeDraft,
    chatHistory,
    chatInput,
    onChangeChatInput: setChatInput,
    chatExpanded: isChatExpanded,
    onExpandChat: () => setChatExpanded(true),
    onCollapseChat: () => setChatExpanded(false),
    canRegenerate: originalPrompt.length > ValueConstants.zero,
    onRegenerate: () => void runGenerate(originalPrompt),
    proposal,
    onSubmitRefine,
    onAcceptProposal,
    onRejectProposal,
    exitOpen: exit.isExitOpen,
    onGenerateAnother: exit.onGenerateAnother,
    onSaveDraftAndExit: () => void exit.onSaveDraftAndExit(),
    onDiscardAndExit: () => void exit.onDiscardAndExit(),
    onKeepEditing: exit.onKeepEditing,
  };
};
