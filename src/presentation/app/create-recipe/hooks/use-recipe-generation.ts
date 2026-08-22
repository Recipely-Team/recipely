import { useCallback, useEffect, useRef, useState } from 'react';
import { ChatRole } from '@domain/drafts/chat-role';
import { StoreStatus } from '@application/store/store-status';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useStores } from '@presentation/bootstrap/use-stores';
import { t } from '@presentation/i18n';
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

interface UseRecipeGenerationArgs {
  recipe: EditableRecipe;
  setRecipe: Dispatch<SetStateAction<EditableRecipe>>;
  activeDraftId: string;
  draftId: string | undefined;
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
 */export const useRecipeGeneration = ({
  recipe,
  setRecipe,
  activeDraftId,
  draftId,
}: UseRecipeGenerationArgs) => {
  const router = useRouter();
  const goBackOrHome = useGoBackOrHome();
  // Read before the stores that depend on it. `useLocalSearchParams` answers
  // undefined where the route has none, so the pair is destructured defensively
  // rather than assumed.
  const params = useLocalSearchParams<{ prompt?: string; fromRecipeId?: string }>() ?? {};
  const promptParam = params.prompt;
  const fromRecipeId = params.fromRecipeId;

  const { createdRecipesStore, draftsStore, recipeDetailStore } = useStores();
  const loadRecipeDetail = recipeDetailStore((st) => st.load);
  const copiedFrom = recipeDetailStore((st) =>
    fromRecipeIdOf(st.byId, fromRecipeId),
  );
  const refineState = createdRecipesStore((s) => s.refineState);
  const latestDraft = draftsStore((s) => s.latestDraft);
  const loadLatestDraft = draftsStore((s) => s.loadLatestDraft);
  const upsertDraft = draftsStore((s) => s.upsertDraft);

  // Opening a draft starts in `Resuming`, NOT `Prompt`: the draft is fetched
  // asynchronously, and defaulting to the prompt phase parked the user on the
  // AI-generate screen for the length of that request — tapping a draft looked
  // like it had opened the wrong screen, or like nothing had happened at all.
  const [phase, setPhase] = useState<PhaseType>(
    draftId === undefined ? PhaseType.Prompt : PhaseType.Resuming,
  );
  const [genStep, setGenStep] = useState(ValueConstants.zero);
  const [prompt, setPrompt] = useState(CharConstants.empty);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const originalPrompt = useRef(CharConstants.empty);

  // The assistant creates a recipe by opening this screen with `?prompt=`,
  // exactly as a person would type it in and tap generate — the prompt appears
  // in the field and the generating view runs where they can see it. A draft
  // being resumed wins: `?draftId=` means the user asked for something else.
  const startedFromParam = useRef(false);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState(CharConstants.empty);
  const [chatExpanded, setChatExpanded] = useState(false);
  const [exitOpen, setExitOpen] = useState(false);
  /**
   * The draft exactly as this screen adopted it, or null for one started here.
   * Leaving with the recipe still identical to it means there is nothing to
   * decide — see {@link onClose}.
   */
  const openedAs = useRef<string | null>(null);
  /**
   * The snapshot this screen adopted, kept whole. The editor has no field for
   * an import's `category`, `tags`, `tips`, `nutrition` or cover, and autosave
   * fires on open — so without carrying the original forward, merely LOOKING at
   * an imported draft overwrote everything the AI had extracted.
   */
  const carried = useRef<DraftRecipeSnapshot | undefined>(undefined);

  const refining = refineState.status === StoreStatus.Refining;

  // Resume a draft passed via ?draftId once on mount.
  useEffect(() => {
    if (draftId === undefined) return;
    let cancelled = false;
    // Also set here, not just in the initial state: the resume card navigates
    // with `router.replace`, which changes the param on an already-mounted
    // screen sitting in `Prompt`.
    setPhase(PhaseType.Resuming);
    FailureReporter.trail(ImportTrail.editorMounted);
    void (async () => {
      FailureReporter.trail(ImportTrail.draftFetchStarted);
      const result = await draftsStore.getState().getDraft(draftId);
      if (cancelled) return;
      // A draft that cannot be read must not leave the screen shimmering
      // forever — fall back to the prompt phase and say WHY. The failure's own
      // copy distinguishes a deleted draft from an expired session from a dead
      // connection; "couldn't open that draft" said none of them, and reporting
      // saw nothing at all.
      if (!result.ok) {
        FailureReporter.trail(ImportTrail.draftFetchFailed);
        // Gone is not unreadable — see the "dead pointer" remark above.
        if (result.failure.code === FailureCode.NotFound) {
          showDangerToast(t().createRecipe.draftGone);
          router.replace({
            pathname: RoutePaths.myRecipes,
            params: { tab: RoutePaths.myRecipesDraftsTab },
          });
          return;
        }
        showErrorToast(result.failure);
        FailureReporter.report(result.failure, 'CreateRecipe.resumeDraft');
        // Drop the param as well as the phase. `activeDraftId` is `draftId ??
        // newDraftId`, so staying on it would point the autosave at the draft
        // that FAILED to load — an offline read leaves that draft intact on the
        // server, and the next thing typed here would overwrite it.
        router.replace(RoutePaths.createRecipe);
        setPhase(PhaseType.Prompt);
        return;
      }
      FailureReporter.trail(ImportTrail.draftFetchOk);
      const loaded = result.value;
      const resumed = snapshotToEditable(loaded.snapshot);
      carried.current = loaded.snapshot;
      setRecipe(resumed);
      openedAs.current = JSON.stringify(editableToSnapshot(resumed, loaded.snapshot));
      setChatHistory([...loaded.chatHistory]);
      originalPrompt.current = loaded.prompt;
      setPrompt(loaded.prompt);
      setPhase(PhaseType.Preview);
      FailureReporter.trail(ImportTrail.editorReady);
    })();
    return () => {
      cancelled = true;
    };
  }, [draftId, draftsStore, setRecipe, router]);

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
    carried: carried.current,
    enabled: phase === PhaseType.Preview,
    draftId: activeDraftId,
    prompt: originalPrompt.current,
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

  // Editing the prompt — by typing or by tapping an idea chip — is the user's fix
  // for a failed run, so any change to it drops the stale error.
  useEffect(() => {
    if (promptParam === undefined || promptParam === CharConstants.empty) return;
    if (draftId !== undefined || startedFromParam.current) return;
    startedFromParam.current = true;
    setPrompt(promptParam);
    void runGenerate(promptParam);
  }, [promptParam, draftId, runGenerate]);

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
    if (draftId !== undefined || startedFromParam.current) return;
    startedFromParam.current = true;

    void loadRecipeDetail(fromRecipeId);
  }, [fromRecipeId, draftId, loadRecipeDetail]);

  useEffect(() => {
    if (copiedFrom === null) return;

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
      openedAs.current === JSON.stringify(editableToSnapshot(recipe, carried.current));
    if (phase === PhaseType.Preview && editableHasContent(recipe) && !unchanged) {
      setExitOpen(true);
      return;
    }
    goBackOrHome();
  }, [phase, recipe, goBackOrHome]);

  const onSaveDraftAndExit = useCallback(async (): Promise<void> => {
    await upsertDraft({
      id: activeDraftId,
      prompt: originalPrompt.current,
      snapshot: editableToSnapshot(recipe, carried.current),
      chatHistory,
    });
    setExitOpen(false);
    goBackOrHome();
  }, [upsertDraft, activeDraftId, recipe, chatHistory, goBackOrHome]);

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
    goBackOrHome();
  }, [cancelAutosave, draftsStore, activeDraftId, goBackOrHome]);

  return {
    phase,
    genStep,
    refining,
    prompt,
    generateError,
    onChangePrompt,
    onAppendChip,
    onGenerate: () => void runGenerate(prompt),
    onStartBlank,
    onImportFromInstagram,
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
    proposal,
    onSubmitRefine,
    onAcceptProposal,
    onRejectProposal,
    exitOpen,
    onSaveDraftAndExit: () => void onSaveDraftAndExit(),
    onDiscardAndExit: () => void onDiscardAndExit(),
    onKeepEditing: () => setExitOpen(false),
  };
};
