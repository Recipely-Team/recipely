import type { Failure } from '@core/failure';
import type { DmKeywords } from '@domain/instagram/dm/dm-keywords';
import type { EditorStepType } from '@presentation/app/automations/edit/model/editor-step';

/** View model returned by {@link useRuleEditor}. */
export interface UseRuleEditorResult {
  /** True while an existing rule is still loading into the form. */
  isLoading: boolean;
  /** Why the rule could not be opened (deleted, someone else's); null otherwise. */
  loadFailure: Failure | null;
  /** Opens the rule again after a failure. */
  retryLoad: () => void;
  isEdit: boolean;
  step: EditorStepType;
  /** Whether each step, in order, holds what it needs. */
  stepValid: readonly boolean[];
  mediaId: string | null;
  keywords: DmKeywords;
  keywordInput: string;
  /** The last keyword refusal's copy; null when none. */
  keywordError: string | null;
  recipeId: string | null;
  recipeName: string | null;
  recipeImage: string | null;
  dmText: string;
  replyOn: boolean;
  replyText: string;
  isSaving: boolean;
  isDeleteOpen: boolean;
  setMedia: (mediaId: string) => void;
  setKeywordInput: (text: string) => void;
  /** Adds a typed word or a suggestion; the field clears on success. */
  addKeyword: (raw: string) => void;
  removeKeyword: (word: string) => void;
  setRecipe: (id: string, name: string, image: string | null) => void;
  setDmText: (text: string) => void;
  setReplyOn: (on: boolean) => void;
  setReplyText: (text: string) => void;
  goTo: (step: EditorStepType) => void;
  next: () => void;
  back: () => void;
  close: () => void;
  save: () => void;
  openDelete: () => void;
  closeDelete: () => void;
  confirmDelete: () => void;
}
