import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'expo-router';
import { useStores } from '@presentation/bootstrap/use-stores';
import { t } from '@presentation/i18n';
import { showDangerToast, showErrorToast } from '@presentation/base/feedback/show-toast';
import {
  failureKeyMessage,
  failureToastMessage,
} from '@presentation/base/errors/failure-lookups';
import { ValidationFailure } from '@core/failure';
import { useDraftAutosave } from '@presentation/app/create-recipe/hooks/use-draft-autosave';
import {
  editableHasContent,
  editableToSnapshot,
  emptyEditable,
  recipeToEditable,
  snapshotToEditable,
} from '@presentation/app/create-recipe/model/drafting/recipe-mapping';
import { buildRefineReply } from '@presentation/app/create-recipe/model/generation/build-refine-reply';
import type { ChatMessage } from '@domain/drafts/chat-message';
import type { PhaseType } from '@presentation/app/create-recipe/model/phase-type';
import type { UseRecipeGenerationArgs } from '@presentation/app/create-recipe/model/generation/use-recipe-generation-args';
import { CharConstants, ValueConstants } from '@core/constants';
import { RoutePaths } from '@presentation/base/constants';

const GEN_STEP_COUNT = 5;
const GEN_STEP_INTERVAL_MS = 620;

/**
 * Drives the AI phase flow of the create screen: prompt → generating → preview,
 * the generate/import/refine calls, the generating-checklist ticker, draft
 * resume + autosave, and the exit-with-unsaved-work flow.
 */
export const useRecipeGeneration = ({
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

  const [phase, setPhase] = useState<PhaseType>('prompt');
  const [importing, setImporting] = useState(false);
  const [genStep, setGenStep] = useState(ValueConstants.zero);
  const [prompt, setPrompt] = useState(CharConstants.empty);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const originalPrompt = useRef(CharConstants.empty);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState(CharConstants.empty);
  const [chatExpanded, setChatExpanded] = useState(false);
  const [exitOpen, setExitOpen] = useState(false);

  const refining = refineState.status === 'refining';

  // Resume a draft passed via ?draftId once on mount.
  useEffect(() => {
    if (draftId === undefined) return;
    let cancelled = false;
    void (async () => {
      const loaded = await draftsStore.getState().getDraft(draftId);
      if (cancelled || loaded === null) return;
      setRecipe(snapshotToEditable(loaded.snapshot));
      setChatHistory([...loaded.chatHistory]);
      originalPrompt.current = loaded.prompt;
      setPrompt(loaded.prompt);
      setPhase('preview');
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
    if (phase !== 'generating') return;
    setGenStep(ValueConstants.zero);
    const id = setInterval(() => {
      setGenStep((s) => Math.min(GEN_STEP_COUNT - 1, s + 1));
    }, GEN_STEP_INTERVAL_MS);
    return () => clearInterval(id);
  }, [phase]);

  useDraftAutosave({
    enabled: phase === 'preview',
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
      setPhase('generating');
      await createdRecipesStore.getState().generateRecipe(trimmed);
      const state = createdRecipesStore.getState().generateState;
      if (state.status === 'success') {
        setRecipe((prev) => recipeToEditable(state.recipe, prev.media));
        setChatHistory([
          { role: 'user', content: trimmed },
          { role: 'assistant', content: t().createRecipe.aiFirstReply },
        ]);
        createdRecipesStore.getState().resetGenerateState();
        setPhase('preview');
        return;
      }
      // WHY: the failure lands back on the prompt phase, which does NOT render the
      // chat transcript — so it must be surfaced as a toast AND kept inline under
      // the input, or the user gets no feedback at all.
      //
      // The backend now names its errors (`failure.messageKey`), so the blanket
      // "rephrase your prompt" copy of PR #157 is gone: a refused prompt
      // (`errors.ai.prompt_rejected` — rewording IS the fix) no longer reads the
      // same as an unusable AI response (`errors.ai.invalid_response` — the prompt
      // was fine, just generate again), even though both arrive as
      // `unprocessable` → ValidationFailure. `showErrorToast` derives message AND
      // severity from that key.
      //
      // `aiPromptFailed` survives as the fallback for the ONE case left: a 4xx we
      // have no key for — an older backend, or a new server key this build has no
      // copy for. Everything else is an infrastructure failure and reads from its
      // class, exactly as before.
      if (state.status === 'error') {
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
      setPhase('prompt');
    },
    [createdRecipesStore, setRecipe],
  );

  const runImport = useCallback(
    async (url: string): Promise<void> => {
      const trimmed = url.trim();
      if (trimmed.length === ValueConstants.zero) return;
      setImporting(true);
      setPhase('generating');
      await createdRecipesStore.getState().importInstagram(trimmed);
      const state = createdRecipesStore.getState().importState;
      if (state.status === 'success') {
        setRecipe((prev) => recipeToEditable(state.recipe, prev.media));
        setChatHistory([{ role: 'assistant', content: t().createRecipe.importFirstReply }]);
        createdRecipesStore.getState().resetImportState();
        setImporting(false);
        setPhase('preview');
        return;
      }
      // The import failure DOES have a transcript to land in (the preview chat),
      // so the assistant bubble says the useful thing whenever the backend named
      // the error — "that's not an Instagram link", "no recipe in that post",
      // "the video is too long" — instead of one flat "couldn't generate".
      // `aiError` remains the fallback for an unnamed failure.
      if (state.status === 'error') showErrorToast(state.failure);
      const reason = state.status === 'error' ? failureKeyMessage(state.failure) : undefined;
      setChatHistory([
        { role: 'assistant', content: reason ?? t().createRecipe.aiError, error: true },
      ]);
      createdRecipesStore.getState().resetImportState();
      setImporting(false);
      setPhase('prompt');
    },
    [createdRecipesStore, setRecipe],
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
      setChatHistory((h) => [...h, { role: 'user', content: trimmed }]);
      const refined = await createdRecipesStore.getState().refineRecipe(editableToSnapshot(recipe), trimmed);
      if (refined !== null) {
        setRecipe((prev) => recipeToEditable(refined.recipe, prev.media));
        const reply = buildRefineReply(refined, t().createRecipe.aiUpdated);
        setChatHistory((h) => [...h, { role: 'assistant', content: reply }]);
        createdRecipesStore.getState().resetRefineState();
        return;
      }
      // `refineRecipe` collapses its failure to `null`, so the reason is read back
      // off the store. Refine hits the same endpoint and the same prompt moderator
      // as generate, so it needs the same disambiguation: a refused instruction
      // must not read like an unusable AI response.
      const state = createdRecipesStore.getState().refineState;
      if (state.status === 'error') showErrorToast(state.failure);
      const reason = state.status === 'error' ? failureKeyMessage(state.failure) : undefined;
      setChatHistory((h) => [
        ...h,
        { role: 'assistant', content: reason ?? t().createRecipe.aiError, error: true },
      ]);
      createdRecipesStore.getState().resetRefineState();
    },
    [createdRecipesStore, recipe, refining, setRecipe],
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
    setPhase('preview');
  }, [setRecipe]);

  const onResumeDraft = useCallback((): void => {
    if (latestDraft === null) return;
    router.replace({ pathname: RoutePaths.createRecipe, params: { draftId: latestDraft.id } });
  }, [latestDraft, router]);

  const onClose = useCallback((): void => {
    if (phase === 'preview' && editableHasContent(recipe)) {
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
    // Best-effort: if the delete fails the draft simply remains in My Recipes.
    await draftsStore.getState().deleteDraft(activeDraftId);
    setExitOpen(false);
    router.back();
  }, [draftsStore, activeDraftId, router]);

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
