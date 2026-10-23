import { useCallback, useEffect, useRef, useState } from 'react';
import { useStore } from 'zustand';
import { ChatRole } from '@domain/drafts/chat-role';
import { StoreStatus } from '@application/store/store-status';
import { useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { useLeaveGuard } from '@presentation/base/hooks/navigation/use-leave-guard';
import { useStores } from '@presentation/bootstrap/use-stores';
import { useTranslations } from '@presentation/i18n';
import { showDangerToast, showErrorToast } from '@presentation/base/feedback/show-toast';
import { FailureReporter } from '@presentation/base/errors/failure-reporter';
import { ImportTrail } from '@presentation/base/errors/import-trail';
import {
  failureKeyMessage,
  failureToastMessage,
} from '@presentation/base/errors/failure-lookups';
import { ValidationFailure } from '@core/failure';
import { FailureCode } from '@core/failure/failure-code';
import { useDraftAutosave } from '@presentation/app/create-recipe/hooks/use-draft-autosave';
import { editableHasContent } from '@presentation/app/create-recipe/model/drafting/editable-has-content';
import { editableToSnapshot } from '@presentation/app/create-recipe/model/drafting/editable-to-snapshot';
import { emptyEditable } from '@presentation/app/create-recipe/model/drafting/empty-editable';
import { fromRecipeIdOf } from '@presentation/app/create-recipe/model/drafting/from-recipe-id-of';
import { recipeToEditable } from '@presentation/app/create-recipe/model/drafting/recipe-to-editable';
import { snapshotToEditable } from '@presentation/app/create-recipe/model/drafting/snapshot-to-editable';
import { useRefineProposal } from '@presentation/app/create-recipe/hooks/use-refine-proposal';
import type { ChatMessage } from '@domain/drafts/chat-message';
import type { DraftRecipeSnapshot } from '@domain/drafts/draft-recipe-snapshot';
import { PhaseType } from '@presentation/app/create-recipe/model/phase-type';
import { CharConstants, ValueConstants } from '@core/constants';
import { RoutePaths } from '@presentation/base/constants';
import { useGoBackOrHome } from '@presentation/base/hooks/navigation/use-go-back-or-home';

import type { Dispatch, SetStateAction } from 'react';
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

const GEN_STEP_COUNT = 5;
const GEN_STEP_INTERVAL_MS = 620;

/**
 * Owns the AI create flow: prompt → generate → preview → refine, draft resume +
 * autosave, and the exit-with-unsaved-work flow.
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
 * - **A dead pointer is its own answer.** Publishing a draft DELETES it, while
 *   the import job and its completion notification go on naming that id for
 *   good — so `?draftId=` routinely points at a draft that no longer exists.
 *   Treating that 404 like any other read failure dropped the user on a blank
 *   AI prompt, which says "your draft failed to open" about a draft they had
 *   already turned into a recipe. Nothing here can be retried, so it says so
 *   and leaves them among the drafts that DO exist.
 * - **A refine outlives the screen**, so publishing or exiting to a draft while
 *   one is in flight must not pop its "Updated!" over whatever comes next.
 * - **Drafts round-trip through the same mapper the comparison uses**, or a
 *   draft that was only opened and closed would compare as changed by whatever
 *   the mapping normalises.
 * - **Editing a saved recipe is not a draft.** `?editRecipeId=` seeds the
 *   editor from the recipe itself (photos included, for display), waits in
 *   `Resuming` and autosaves nothing. Leaving with changes asks save-or-discard
 *   (the screen routes "save" to PATCH); leaving unchanged just goes.
 */export const useRecipeGeneration = ({
  recipe,
  setRecipe,
  activeDraftId,
  draftId,
  editRecipeId,
}: UseRecipeGenerationArgs) => {
  const t = useTranslations();
  const router = useRouter();
  const goBackOrHome = useGoBackOrHome();
  // ?? {} only for test stubs; the real hook returns {} without params.
  const params = useLocalSearchParams<{ prompt?: string; fromRecipeId?: string }>() ?? {};
  const promptParam = params.prompt;
  const fromRecipeId = params.fromRecipeId;

  const { recipeAuthoringStore, draftsStore, recipeDetailStore } = useStores();
  const loadRecipeDetail = useStore(recipeDetailStore, (st) => st.load);
  const copiedFrom = useStore(recipeDetailStore, (st) =>
    fromRecipeIdOf(st.byId, fromRecipeId));
  const editing = useStore(recipeDetailStore, (st) => fromRecipeIdOf(st.byId, editRecipeId));
  const editState = useStore(recipeDetailStore, (st) =>
    editRecipeId === undefined ? undefined : st.byId[editRecipeId]);
  const refineState = useStore(recipeAuthoringStore, (s) => s.refineState);
  const latestDraft = useStore(draftsStore, (s) => s.latestDraft);
  const loadLatestDraft = useStore(draftsStore, (s) => s.loadLatestDraft);
  const upsertDraft = useStore(draftsStore, (s) => s.upsertDraft);

  // A draft opens in Resuming: it is fetched asynchronously.
  const [phase, setPhase] = useState<PhaseType>(
    draftId === undefined && editRecipeId === undefined ? PhaseType.Prompt : PhaseType.Resuming,
  );
  const [genStep, setGenStep] = useState(ValueConstants.zero);
  const [prompt, setPrompt] = useState(CharConstants.empty);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [originalPrompt, setOriginalPrompt] = useState(CharConstants.empty);

  // The assistant generates via ?prompt=; a ?draftId= being resumed wins.
  const startedFromParam = useRef(false);
  /**
   * Whether the copy has already been laid into the editor.
   *
   * `startedFromParam` latches the LOAD; without this, any later change to the
   * cached recipe re-ran the seed and threw away whatever the user had edited
   * in their copy, dropping them back to preview.
   */
  const seeded = useRef(false);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState(CharConstants.empty);
  const [chatExpanded, setChatExpanded] = useState(false);
  const [exitOpen, setExitOpen] = useState(false);
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

  const refining = refineState.status === StoreStatus.Refining;

  // router.replace changes the param on an already-mounted screen: that draft resumes too.
  const [resumingFor, setResumingFor] = useState(draftId);
  if (draftId !== resumingFor) {
    setResumingFor(draftId);
    if (draftId !== undefined) setPhase(PhaseType.Resuming);
  }

  // Resume a draft passed via ?draftId once on mount.
  useEffect(() => {
    if (draftId === undefined) return;
    let cancelled = false;
    FailureReporter.trail(ImportTrail.editorMounted);
    void (async () => {
      FailureReporter.trail(ImportTrail.draftFetchStarted);
      const result = await draftsStore.getState().getDraft(draftId);
      if (cancelled) return;
      // An unreadable draft falls back to the prompt phase and says why.
      if (!result.ok) {
        FailureReporter.trail(ImportTrail.draftFetchFailed);
        // Gone is not unreadable — see the "dead pointer" remark above.
        if (result.failure.code === FailureCode.NotFound) {
          showDangerToast(t.createRecipe.draftGone);
          router.replace({
            pathname: RoutePaths.myRecipes,
            params: { tab: RoutePaths.myRecipesDraftsTab },
          });
          return;
        }
        showErrorToast(result.failure);
        FailureReporter.report(result.failure, 'CreateRecipe.resumeDraft');
        // Drop the param too, or autosave would target the draft that failed to load.
        router.replace(RoutePaths.createRecipe);
        setPhase(PhaseType.Prompt);
        return;
      }
      FailureReporter.trail(ImportTrail.draftFetchOk);
      const loaded = result.value;
      const resumed = snapshotToEditable(loaded.snapshot);
      setCarried(loaded.snapshot);
      setRecipe(resumed);
      setOpenedAs(JSON.stringify(editableToSnapshot(resumed, loaded.snapshot)));
      setChatHistory([...loaded.chatHistory]);
      setOriginalPrompt(loaded.prompt);
      setPrompt(loaded.prompt);
      setPhase(PhaseType.Preview);
      FailureReporter.trail(ImportTrail.editorReady);
    })();
    return () => {
      cancelled = true;
    };
  }, [draftId, draftsStore, setRecipe, router, t]);

  // Surface a "Resume your draft" card on a fresh prompt phase.
  useEffect(() => {
    if (draftId === undefined && editRecipeId === undefined) void loadLatestDraft();
  }, [draftId, editRecipeId, loadLatestDraft]);

  useEffect(() => {
    if (editRecipeId === undefined) return;
    void loadRecipeDetail(editRecipeId);
  }, [editRecipeId, loadRecipeDetail]);

  useEffect(() => {
    if (editState?.status !== StoreStatus.Error) return;
    showErrorToast(editState.failure);
    goBackOrHome();
  }, [editState, goBackOrHome]);

  useEffect(() => {
    if (editing === null || seeded.current) return;
    seeded.current = true;
    const opened = recipeToEditable(editing, []);
    setRecipe(opened);
    // What "unchanged" is measured against when the user leaves.
    setOpenedAs(JSON.stringify(editableToSnapshot(opened, undefined)));
    setPhase(PhaseType.Preview);
  }, [editing, setRecipe]);

  // Drive the generating checklist while the backend works.
  useEffect(() => {
    if (phase !== PhaseType.Generating) return;
    const id = setInterval(() => {
      setGenStep((s) => Math.min(GEN_STEP_COUNT - ValueConstants.one, s + ValueConstants.one));
    }, GEN_STEP_INTERVAL_MS);
    return () => clearInterval(id);
  }, [phase]);

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
    chatExpanded,
    refining,
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
      setGenStep(ValueConstants.zero);
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
        const unnamed4xx =
          failure instanceof ValidationFailure && failureKeyMessage(t, failure) === undefined;
        const message = unnamed4xx
          ? t.createRecipe.aiPromptFailed
          : failureToastMessage(t, failure);
        if (unnamed4xx) showDangerToast(message);
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

  /**
   * Fills the editor from a recipe that already exists.
   *
   * @remarks
   * Asked to make the same recipe, the assistant used to hand the words to the
   * generator, which invented something adjacent — a different ingredient
   * list, different times, a different name. A copy is a copy: the fields are
   * read from the recipe itself and the user edits from there.
   *
   * Media is deliberately NOT carried over. The photographs belong to whoever
   * took them, and a copy that arrives wearing someone else's picture is a
   * claim the user did not make.
   */
  useEffect(() => {
    if (fromRecipeId === undefined || fromRecipeId === CharConstants.empty) return;
    if (draftId !== undefined || editRecipeId !== undefined || startedFromParam.current) return;
    startedFromParam.current = true;

    void loadRecipeDetail(fromRecipeId);
  }, [fromRecipeId, draftId, editRecipeId, loadRecipeDetail]);

  useEffect(() => {
    if (copiedFrom === null || seeded.current) return;
    seeded.current = true;

    setRecipe(recipeToEditable(copiedFrom, []));
    setPhase(PhaseType.Preview);
  }, [copiedFrom, setRecipe]);

  const onChangePrompt = useCallback((value: string): void => {
    setPrompt(value);
    setGenerateError(null);
  }, []);

  const onAppendChip = useCallback((chip: string): void => {
    setPrompt((p) => (p.trim().length === ValueConstants.zero ? chip : `${p}, ${chip.toLowerCase()}`));
    setGenerateError(null);
  }, []);

  const onImportFromInstagram = useCallback((): void => {
    router.push(RoutePaths.importRecipe);
  }, [router]);

  const onImportFromFile = useCallback((): void => {
    router.push(RoutePaths.importRecipeFromFile);
  }, [router]);

  const onStartBlank = useCallback((): void => {
    setRecipe(emptyEditable());
    setChatHistory([]);
    setOriginalPrompt(CharConstants.empty);
    setPhase(PhaseType.Preview);
  }, [setRecipe]);

  const onResumeDraft = useCallback((): void => {
    if (latestDraft === null) return;
    router.replace({ pathname: RoutePaths.createRecipe, params: { draftId: latestDraft.id } });
  }, [latestDraft, router]);

  // Opening an existing draft and leaving wrote nothing, so there is nothing to ask about.
  /** Work that is not in the drafts list yet — the only thing worth asking about. */
  const hasUnkeptWork = useCallback((): boolean => {
    const unchanged =
      openedAs !== null && openedAs === JSON.stringify(editableToSnapshot(recipe, carried));
    // Editing a saved recipe asks about ANY change — clearing a field is one too.
    if (editRecipeId !== undefined) return phase === PhaseType.Preview && !unchanged;
    return phase === PhaseType.Preview && editableHasContent(recipe) && !unchanged;
  }, [editRecipeId, phase, recipe, openedAs, carried]);

  const onClose = useCallback((): boolean => {
    if (hasUnkeptWork()) {
      setExitOpen(true);
      return true;
    }
    goBackOrHome();
    return false;
  }, [hasUnkeptWork, goBackOrHome]);

  /**
   * What to do once the exit question has an answer, when the user was on their
   * way somewhere rather than simply leaving.
   *
   * Asked for a new recipe with a draft open, the assistant used to answer that
   * the draft would be lost and stop there — a refusal, with the question left
   * hanging in a conversation that had no way to answer it. The question now
   * comes with the request, on screen, and whichever answer it gets the thing
   * the user actually asked for still happens.
   */
  const afterExit = useRef<(() => void) | null>(null);

  const leaveFor = useCallback(
    (next: () => void): boolean => {
      if (!hasUnkeptWork()) {
        next();
        return false;
      }
      afterExit.current = next;
      setExitOpen(true);
      return true;
    },
    [hasUnkeptWork],
  );

  // The system's own back (Android back, iOS swipe) asks the same question as the close button.
  useLeaveGuard(hasUnkeptWork(), (release) => {
    afterExit.current = release;
    setExitOpen(true);
  });

  /** Either the errand the user was on, or the plain way out. */
  const leave = useCallback((): void => {
    const next = afterExit.current;
    afterExit.current = null;
    if (next === null) goBackOrHome();
    else next();
  }, [goBackOrHome]);

  const onGenerateAnother = useCallback(
    (wanted: string): boolean =>
      leaveFor(() => router.replace(RoutePaths.createRecipeWithPrompt(wanted) as Href)),
    [leaveFor, router],
  );

  const onSaveDraftAndExit = useCallback(async (): Promise<void> => {
    await upsertDraft({
      id: activeDraftId,
      prompt: originalPrompt,
      snapshot: editableToSnapshot(recipe, carried),
      chatHistory,
    });
    setExitOpen(false);
    leave();
  }, [upsertDraft, activeDraftId, recipe, chatHistory, leave, originalPrompt, carried]);

  const onDiscardAndExit = useCallback(async (): Promise<void> => {
    // Cancel autosave BEFORE deleting, or a pending save re-creates the draft.
    cancelAutosave();
    // Best-effort: a failed delete leaves the draft in My Recipes.
    if (editRecipeId === undefined) await draftsStore.getState().deleteDraft(activeDraftId);
    setExitOpen(false);
    leave();
  }, [cancelAutosave, draftsStore, activeDraftId, editRecipeId, leave]);

  return {
    importReview: importReviewOf(carried),
    flushDraft,
    stopAutosave: cancelAutosave,
    phase,
    genStep,
    refining,
    prompt,
    generateError,
    onChangePrompt,
    onAppendChip,
    onGenerate: () => void runGenerate(prompt),
    onCancelGenerate,
    onStartBlank,
    onImportFromInstagram,
    onImportFromFile,
    onClose,
    latestDraft,
    onResumeDraft,
    chatHistory,
    chatInput,
    onChangeChatInput: setChatInput,
    chatExpanded,
    onExpandChat: () => setChatExpanded(true),
    onCollapseChat: () => setChatExpanded(false),
    canRegenerate: originalPrompt.length > ValueConstants.zero,
    onRegenerate: () => void runGenerate(originalPrompt),
    proposal,
    onSubmitRefine,
    onAcceptProposal,
    onRejectProposal,
    exitOpen,
    onGenerateAnother,
    onSaveDraftAndExit: () => void onSaveDraftAndExit(),
    onDiscardAndExit: () => void onDiscardAndExit(),
    // Keep editing: neither choice, so the pending errand is dropped.
    onKeepEditing: () => {
      afterExit.current = null;
      setExitOpen(false);
    },
  };
};
