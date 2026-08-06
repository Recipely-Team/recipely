import { useCallback, useEffect, useRef, useState } from 'react';
import { ChatRole } from '@domain/drafts/chat-role';
import { StoreStatus } from '@application/store/store-status';
import { useRouter } from 'expo-router';
import { useStores } from '@presentation/bootstrap/use-stores';
import { t } from '@presentation/i18n';
import { showDangerToast, showErrorToast, showSuccessToast } from '@presentation/base/feedback/show-toast';
import {
  failureKeyMessage,
  failureToastMessage,
} from '@presentation/base/errors/failure-lookups';
import { ValidationFailure } from '@core/failure';
import { useDraftAutosave } from '@presentation/app/create-recipe/hooks/use-draft-autosave';
import { editableHasContent } from '@presentation/app/create-recipe/model/drafting/editable-has-content';
import { editableToSnapshot } from '@presentation/app/create-recipe/model/drafting/editable-to-snapshot';
import { emptyEditable } from '@presentation/app/create-recipe/model/drafting/empty-editable';
import { recipeToEditable } from '@presentation/app/create-recipe/model/drafting/recipe-to-editable';
import { snapshotToEditable } from '@presentation/app/create-recipe/model/drafting/snapshot-to-editable';
import { buildRefineReply } from '@presentation/app/create-recipe/model/generation/build-refine-reply';
import type { ChatMessage } from '@domain/drafts/chat-message';
import { PhaseType } from '@presentation/app/create-recipe/model/phase-type';
import { CharConstants, ValueConstants } from '@core/constants';
import { RoutePaths } from '@presentation/base/constants';

import type { Dispatch, SetStateAction } from 'react';
import type { EditableRecipe } from '@presentation/app/create-recipe/model/drafting/editable-recipe';

interface UseRecipeGenerationArgs {
  recipe: EditableRecipe;
  setRecipe: Dispatch<SetStateAction<EditableRecipe>>;
  activeDraftId: string;
  draftId: string | undefined;
  importUrl: string | undefined;
}

const GEN_STEP_COUNT = 5;
const GEN_STEP_INTERVAL_MS = 620;

/**
 * Owns the AI create flow: prompt → generate → preview → refine, the Instagram
 * import, draft resume + autosave, and the exit-with-unsaved-work flow.
 *
 * @remarks
 * - **Where a failure can be shown decides how it is shown.** A generate
 *   failure lands back on the prompt phase, which renders no chat transcript,
 *   so it is surfaced as a toast AND kept inline under the input. An import
 *   failure does have a transcript to land in, so the assistant bubble carries
 *   the reason.
 * - **The backend names its errors** (`failure.messageKey`), so a refused
 *   prompt (rewording IS the fix) no longer reads the same as an unusable AI
 *   response (the prompt was fine, generate again) even though both arrive as
 *   `unprocessable` → `ValidationFailure`. `aiPromptFailed` survives only for a
 *   4xx with no key — an older backend, or a server key this build predates.
 * - **A refine outlives the screen**, so publishing or exiting to a draft while
 *   one is in flight must not pop its "Updated!" over whatever comes next.
 * - **Drafts round-trip through the same mapper the comparison uses**, or a
 *   draft that was only opened and closed would compare as changed by whatever
 *   the mapping normalises.
 */export const useRecipeGeneration = ({
  recipe,
  setRecipe,
  activeDraftId,
  draftId,
  importUrl,
}: UseRecipeGenerationArgs) => {
  const router = useRouter();
  const { createdRecipesStore, draftsStore } = useStores();
  const refineState = createdRecipesStore((s) => s.refineState);
  const latestDraft = draftsStore((s) => s.latestDraft);
  const loadLatestDraft = draftsStore((s) => s.loadLatestDraft);
  const upsertDraft = draftsStore((s) => s.upsertDraft);

  const [phase, setPhase] = useState<PhaseType>(PhaseType.Prompt);
  const [importing, setImporting] = useState(false);
  const [genStep, setGenStep] = useState(ValueConstants.zero);
  const [prompt, setPrompt] = useState(CharConstants.empty);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const originalPrompt = useRef(CharConstants.empty);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState(CharConstants.empty);
  const [chatExpanded, setChatExpanded] = useState(false);
  const mounted = useRef(true);
  useEffect(() => () => { mounted.current = false; }, []);
  const [exitOpen, setExitOpen] = useState(false);
  /**
   * The draft exactly as this screen adopted it, or null for one started here.
   * Leaving with the recipe still identical to it means there is nothing to
   * decide — see {@link onClose}.
   */
  const openedAs = useRef<string | null>(null);

  const refining = refineState.status === StoreStatus.Refining;

  // Resume a draft passed via ?draftId once on mount.
  useEffect(() => {
    if (draftId === undefined) return;
    let cancelled = false;
    void (async () => {
      const loaded = await draftsStore.getState().getDraft(draftId);
      if (cancelled || loaded === null) return;
      const resumed = snapshotToEditable(loaded.snapshot);
      setRecipe(resumed);
      openedAs.current = JSON.stringify(editableToSnapshot(resumed));
      setChatHistory([...loaded.chatHistory]);
      originalPrompt.current = loaded.prompt;
      setPrompt(loaded.prompt);
      setPhase(PhaseType.Preview);
    })();
    return () => {
      cancelled = true;
    };
  }, [draftId, draftsStore, setRecipe]);

  // Surface a "Resume your draft" card on a fresh prompt phase.
  useEffect(() => {
    if (draftId === undefined) void loadLatestDraft();
  }, [draftId, loadLatestDraft]);

  // Drive the generating checklist while the backend works.
  useEffect(() => {
    if (phase !== PhaseType.Generating) return;
    setGenStep(ValueConstants.zero);
    const id = setInterval(() => {
      setGenStep((s) => Math.min(GEN_STEP_COUNT - ValueConstants.one, s + ValueConstants.one));
    }, GEN_STEP_INTERVAL_MS);
    return () => clearInterval(id);
  }, [phase]);

  const cancelAutosave = useDraftAutosave({
    enabled: phase === PhaseType.Preview,
    draftId: activeDraftId,
    prompt: originalPrompt.current,
    recipe,
    chatHistory,
    upsertDraft,
  });

  const runGenerate = useCallback(
    async (text: string): Promise<void> => {
      const trimmed = text.trim();
      if (trimmed.length === ValueConstants.zero) return;
      originalPrompt.current = trimmed;
      setGenerateError(null);
      setPhase(PhaseType.Generating);
      await createdRecipesStore.getState().generateRecipe(trimmed);
      const state = createdRecipesStore.getState().generateState;
      if (state.status === StoreStatus.Success) {
        setRecipe((prev) => recipeToEditable(state.recipe, prev.media));
        setChatHistory([
          { role: ChatRole.User, content: trimmed },
          { role: ChatRole.Assistant, content: t().createRecipe.aiFirstReply },
        ]);
        createdRecipesStore.getState().resetGenerateState();
        setPhase(PhaseType.Preview);
        return;
      }
      if (state.status === StoreStatus.Error) {
        const { failure } = state;
        const unnamed4xx =
          failure instanceof ValidationFailure && failureKeyMessage(failure) === undefined;
        const message = unnamed4xx
          ? t().createRecipe.aiPromptFailed
          : failureToastMessage(failure);
        if (unnamed4xx) showDangerToast(message);
        else showErrorToast(failure);
        setGenerateError(message);
      }
      createdRecipesStore.getState().resetGenerateState();
      setPhase(PhaseType.Prompt);
    },
    [createdRecipesStore, setRecipe],
  );

  /**
   * Hands the import to the queue and returns.
   *
   * @remarks
   * The synchronous import held the screen for the 59-128 s the pipeline takes,
   * and a phone that backgrounded the app lost the result outright — the work
   * ran to completion and was thrown away. Now the request is over in a moment
   * and the recipe arrives as a notification that opens the draft.
   *
   * The screen deliberately returns to the prompt phase rather than showing a
   * preview: there is nothing to preview yet, and a spinner that says "almost
   * done" about work nobody is waiting on is worse than no spinner at all.
   */
  const runImport = useCallback(
    async (url: string): Promise<void> => {
      const trimmed = url.trim();
      if (trimmed.length === ValueConstants.zero) return;
      setImporting(true);
      const job = await createdRecipesStore.getState().enqueueInstagramImport(trimmed);
      const state = createdRecipesStore.getState().enqueueImportState;
      createdRecipesStore.getState().resetEnqueueImportState();
      setImporting(false);

      // A TOAST, not a chat message. The prompt phase does not render
      // `chatHistory` — it never receives it — so the confirmation written
      // there was invisible: sharing a link opened a blank create screen and
      // said nothing, which read as the import having silently failed.
      if (job !== null) {
        showSuccessToast(t().createRecipe.importQueuedBody);
        setPhase(PhaseType.Prompt);
        return;
      }

      if (state.status === StoreStatus.Error) showErrorToast(state.failure);
      else showDangerToast(t().createRecipe.aiError);
      setPhase(PhaseType.Prompt);
    },
    [createdRecipesStore],
  );

  // Kick off an Instagram import once when arriving via a share intent.
  const importHandledRef = useRef(false);
  useEffect(() => {
    if (importUrl === undefined || importHandledRef.current) return;
    importHandledRef.current = true;
    void runImport(importUrl);
  }, [importUrl, runImport]);

  const handleRefine = useCallback(
    async (instruction: string): Promise<void> => {
      const trimmed = instruction.trim();
      if (trimmed.length === ValueConstants.zero || refining) return;
      setChatInput(CharConstants.empty);
      setChatExpanded(true);
      setChatHistory((h) => [...h, { role: ChatRole.User, content: trimmed }]);
      const refined = await createdRecipesStore.getState().refineRecipe(editableToSnapshot(recipe), trimmed);
      if (refined !== null) {
        setRecipe((prev) => recipeToEditable(refined.recipe, prev.media));
        const reply = buildRefineReply(refined, t().createRecipe.aiUpdated);
        setChatHistory((h) => [...h, { role: ChatRole.Assistant, content: reply }]);
        // The answer landed with the assistant closed: the recipe has just
        // rewritten itself under the user, and the bubble explaining it is
        // behind a panel they cannot see. Say it out loud instead.
        if (!chatExpanded && mounted.current) showSuccessToast(t().createRecipe.aiUpdated);
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
    [createdRecipesStore, recipe, refining, setRecipe, chatExpanded],
  );

  // Editing the prompt — by typing or by tapping an idea chip — is the user's fix
  // for a failed run, so any change to it drops the stale error.
  const onChangePrompt = useCallback((value: string): void => {
    setPrompt(value);
    setGenerateError(null);
  }, []);

  const onAppendChip = useCallback((chip: string): void => {
    setPrompt((p) => (p.trim().length === ValueConstants.zero ? chip : `${p}, ${chip.toLowerCase()}`));
    setGenerateError(null);
  }, []);

  const onStartBlank = useCallback((): void => {
    setRecipe(emptyEditable());
    setChatHistory([]);
    originalPrompt.current = CharConstants.empty;
    setPhase(PhaseType.Preview);
  }, [setRecipe]);

  const onResumeDraft = useCallback((): void => {
    if (latestDraft === null) return;
    router.replace({ pathname: RoutePaths.createRecipe, params: { draftId: latestDraft.id } });
  }, [latestDraft, router]);

  // WHY the identity check: the exit dialog asks what should happen to work
  // that is not in the drafts list yet. Opening an existing draft, reading it,
  // and backing out is not that — nothing was written, so there is nothing to
  // keep or throw away. It asked anyway, and its only non-destructive answer
  // re-saved a draft that was already saved, on every single exit.
  const onClose = useCallback((): void => {
    const unchanged =
      openedAs.current !== null &&
      openedAs.current === JSON.stringify(editableToSnapshot(recipe));
    if (phase === PhaseType.Preview && editableHasContent(recipe) && !unchanged) {
      setExitOpen(true);
      return;
    }
    router.back();
  }, [phase, recipe, router]);

  const onSaveDraftAndExit = useCallback(async (): Promise<void> => {
    await upsertDraft({
      id: activeDraftId,
      prompt: originalPrompt.current,
      snapshot: editableToSnapshot(recipe),
      chatHistory,
    });
    setExitOpen(false);
    router.back();
  }, [upsertDraft, activeDraftId, recipe, chatHistory, router]);

  const onDiscardAndExit = useCallback(async (): Promise<void> => {
    // Stop autosaving BEFORE the delete, not after: the timer armed by the
    // user's last keystroke was still pending, so it could fire while the
    // delete was in flight and upsert the draft back into the list the user
    // had just removed it from. That is why "leave without saving" appeared to
    // do nothing.
    cancelAutosave();
    // Best-effort: if the delete fails the draft simply remains in My Recipes.
    await draftsStore.getState().deleteDraft(activeDraftId);
    setExitOpen(false);
    router.back();
  }, [cancelAutosave, draftsStore, activeDraftId, router]);

  return {
    phase,
    importing,
    genStep,
    refining,
    prompt,
    generateError,
    onChangePrompt,
    onAppendChip,
    onGenerate: () => void runGenerate(prompt),
    onStartBlank,
    onClose,
    latestDraft,
    onResumeDraft,
    chatHistory,
    chatInput,
    onChangeChatInput: setChatInput,
    chatExpanded,
    onExpandChat: () => setChatExpanded(true),
    onCollapseChat: () => setChatExpanded(false),
    canRegenerate: originalPrompt.current.length > ValueConstants.zero,
    onRegenerate: () => void runGenerate(originalPrompt.current),
    onSubmitRefine: (instruction: string) => void handleRefine(instruction),
    exitOpen,
    onSaveDraftAndExit: () => void onSaveDraftAndExit(),
    onDiscardAndExit: () => void onDiscardAndExit(),
    onKeepEditing: () => setExitOpen(false),
  };
};
