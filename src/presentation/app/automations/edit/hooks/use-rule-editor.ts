import { useEffect, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StoreStatus } from '@application/store/store-status';
import { CharConstants, ValueConstants } from '@core/constants';
import { DmKeywords } from '@domain/instagram/dm/dm-keywords';
import { DmRuleDraft } from '@domain/instagram/dm/dm-rule-draft';
import { useStores } from '@presentation/bootstrap/use-stores';
import { showErrorToast, showSuccessToast } from '@presentation/base/feedback/show-toast';
import { RoutePaths } from '@presentation/base/constants';
import { EditorStep, type EditorStepType } from '@presentation/app/automations/edit/model/editor-step';
import { EDITOR_STEPS } from '@presentation/app/automations/edit/model/editor-steps';
import type { UseRuleEditorResult } from '@presentation/app/automations/edit/model/use-rule-editor-result';
import { useAutomationsGuard } from '@presentation/app/automations/shared/hooks/use-automations-guard';
import { t } from '@presentation/i18n';

/**
 * The rule editor (spec §3): four steps, each gated by what the domain would
 * accept (`DmKeywords`, `DmRuleDraft`), then save or delete.
 *
 * @remarks
 * - **An existing rule fills the form once**, when it arrives; edits after
 *   that are the user's. Its post cannot change — the API refuses it — so
 *   the post step only shows it.
 * - **A rule that cannot be opened is an error with Try again**, never an
 *   endless spinner; without an Instagram link the editor is not reachable.
 * - **Forward only through valid steps**; back is always free.
 */
export const useRuleEditor = (): UseRuleEditorResult => {
  const router = useRouter();
  const params = useLocalSearchParams<{ ruleId?: string }>();
  const ruleId = params.ruleId === undefined || params.ruleId.length === ValueConstants.zero ? null : params.ruleId;
  const { automationsStore } = useStores();
  const opened = automationsStore((s) => s.opened);
  const copy = t().instagram;

  const [step, setStep] = useState<EditorStepType>(ruleId === null ? EditorStep.Post : EditorStep.Keywords);
  const [mediaId, setMediaId] = useState<string | null>(null);
  const [keywords, setKeywords] = useState(DmKeywords.empty());
  const [keywordInput, setKeywordInput] = useState(CharConstants.empty);
  const [keywordError, setKeywordError] = useState<string | null>(null);
  const [recipe, setRecipeState] = useState<{ id: string; name: string; image: string | null } | null>(null);
  const [dmText, setDmText] = useState(copy.defaultMessage);
  const [replyOn, setReplyOn] = useState(false);
  const [replyText, setReplyText] = useState(copy.defaultReply);
  const [isSaving, setSaving] = useState(false);
  const [isDeleteOpen, setDeleteOpen] = useState(false);
  const [seeded, setSeeded] = useState(false);

  useAutomationsGuard(false);

  useEffect(() => {
    if (ruleId !== null) void automationsStore.getState().openRule(ruleId);
  }, [automationsStore, ruleId]);
  const loadFailure = ruleId !== null && opened.status === StoreStatus.Error && opened.id === ruleId ? opened.failure : null;

  const existing = ruleId !== null && opened.status === StoreStatus.Loaded && opened.rule.id === ruleId ? opened.rule : null;
  if (existing !== null && !seeded) {
    setSeeded(true);
    setMediaId(existing.mediaId);
    setKeywords(DmKeywords.of(existing.keywords));
    setRecipeState({ id: existing.recipeId, name: existing.recipe?.name ?? existing.recipeId, image: existing.recipe?.image ?? null });
    setDmText(existing.dmText);
    setReplyOn(existing.publicReplyText !== null);
    setReplyText(existing.publicReplyText ?? copy.defaultReply);
  }

  const publicReply = replyOn ? replyText : null;
  const stepValid = [mediaId !== null, keywords.isValid, recipe !== null, DmRuleDraft.isDmTextValid(dmText) && DmRuleDraft.isPublicReplyValid(publicReply)];
  const canReach = (target: EditorStepType): boolean => EDITOR_STEPS.slice(ValueConstants.zero, target).every((s) => stepValid[s]);
  const toList = (): void => (router.canGoBack() ? router.back() : router.replace(RoutePaths.automations));

  const addKeyword = (raw: string): void => {
    const next = keywords.with(raw);
    if (!next.ok) return setKeywordError(keywords.isFull ? copy.keywordsMax : copy.keywordInvalid);
    setKeywords(next.value);
    setKeywordInput(CharConstants.empty);
    setKeywordError(null);
  };

  return {
    isLoading: ruleId !== null && !seeded && loadFailure === null,
    loadFailure,
    retryLoad: () => {
      if (ruleId !== null) void automationsStore.getState().openRule(ruleId);
    },
    isEdit: ruleId !== null,
    step,
    stepValid,
    mediaId,
    keywords,
    keywordInput,
    keywordError,
    recipeId: recipe?.id ?? null,
    recipeName: recipe?.name ?? null,
    recipeImage: recipe?.image ?? null,
    dmText,
    replyOn,
    replyText,
    isSaving,
    isDeleteOpen,
    setMedia: (id) => {
      if (ruleId === null) setMediaId(id);
    },
    setKeywordInput: (text) => {
      setKeywordInput(text);
      setKeywordError(null);
    },
    addKeyword,
    removeKeyword: (word) => setKeywords(keywords.without(word)),
    setRecipe: (id, name, image) => setRecipeState({ id, name, image }),
    setDmText,
    setReplyOn,
    setReplyText,
    goTo: (target) => {
      if (target <= step || canReach(target)) setStep(target);
    },
    next: () => {
      if (stepValid[step] && step < EditorStep.Message) setStep(EDITOR_STEPS[step + ValueConstants.one] ?? step);
    },
    back: () => (step === EditorStep.Post || (ruleId !== null && step === EditorStep.Keywords) ? toList() : setStep(EDITOR_STEPS[step - ValueConstants.one] ?? step)),
    close: toList,
    save: () => {
      const draft = DmRuleDraft.validate({ mediaId, keywords, recipeId: recipe?.id ?? null, dmText, publicReplyText: publicReply });
      if (!draft.ok || isSaving) return;
      setSaving(true);
      void automationsStore
        .getState()
        .saveRule(draft.value, ruleId)
        .then((result) => {
          setSaving(false);
          if (!result.ok) return void showErrorToast(result.failure);
          showSuccessToast(copy.saved);
          toList();
        });
    },
    openDelete: () => setDeleteOpen(true),
    closeDelete: () => setDeleteOpen(false),
    confirmDelete: () => {
      if (ruleId === null) return;
      setSaving(true);
      void automationsStore
        .getState()
        .deleteRule(ruleId)
        .then((result) => {
          setSaving(false);
          setDeleteOpen(false);
          if (!result.ok) return void showErrorToast(result.failure);
          showSuccessToast(copy.deleted);
          router.replace(RoutePaths.automations);
        });
    },
  };
};
