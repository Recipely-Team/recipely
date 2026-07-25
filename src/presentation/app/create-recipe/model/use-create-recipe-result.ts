import type { EdgeInsets } from 'react-native-safe-area-context';
import type { EditableRecipe } from '@presentation/app/create-recipe/model/drafting/editable-recipe';
import type { PhaseType } from '@presentation/app/create-recipe/model/phase-type';
import type { CreateRecipeFieldErrors } from '@presentation/app/create-recipe/model/validation/create-recipe-field-errors';
import type { ChatMessage } from '@domain/drafts/chat-message';
import type { RecipeDraft } from '@domain/drafts/recipe-draft';
import type { MediaItem } from '@domain/recipes/media/media-item';

/** View model returned by {@link useCreateRecipe} for the create/edit screen. */
export interface UseCreateRecipeResult {
  phase: PhaseType;
  isEditMode: boolean;
  isWebShell: boolean;
  insets: EdgeInsets;

  // Prompt phase.
  prompt: string;
  /** Inline copy for a failed generate run, shown under the prompt input. */
  generateError: string | null;
  onChangePrompt: (value: string) => void;
  onAppendChip: (chip: string) => void;
  onGenerate: () => void;
  onStartBlank: () => void;
  onClose: () => void;
  latestDraft: RecipeDraft | null;
  onResumeDraft: () => void;

  // Generating phase.
  genStep: number;
  importing: boolean;

  // Header.
  headerTitle: string;
  saveLabel: string;
  isSaving: boolean;
  onSave: () => void;

  // Preview editor.
  refining: boolean;
  recipe: EditableRecipe;
  fieldErrors: CreateRecipeFieldErrors['fields'];
  onUpdateField: <K extends keyof EditableRecipe>(key: K, value: EditableRecipe[K]) => void;
  onChangeIngredient: (index: number, value: string) => void;
  onRemoveIngredient: (index: number) => void;
  onAddIngredient: () => void;
  onChangeStep: (index: number, value: string) => void;
  onRemoveStep: (index: number) => void;
  onAddStep: () => void;
  onOpenPhotos: () => void;

  // Refine dock.
  chatHistory: ChatMessage[];
  chatInput: string;
  onChangeChatInput: (value: string) => void;
  chatExpanded: boolean;
  onExpandChat: () => void;
  onCollapseChat: () => void;
  canRegenerate: boolean;
  onRegenerate: () => void;
  onSubmitRefine: (instruction: string) => void;

  // Photos sheet.
  photosOpen: boolean;
  onClosePhotos: () => void;
  onAddMedia: (items: MediaItem[]) => void;
  onRemoveMedia: (index: number) => void;
  onSetCover: (index: number) => void;

  // Exit sheet.
  exitOpen: boolean;
  onSaveDraftAndExit: () => void;
  onDiscardAndExit: () => void;
  onKeepEditing: () => void;

  // Save-error dialog.
  saveError: { message: string; mode: 'publish' | 'update' } | null;
  onConfirmSaveError: () => void;
  onCloseSaveError: () => void;

  // Rejected-save dialog (pre-submit guards + validation failures).
  saveIssue: string | null;
  onCloseSaveIssue: () => void;

  // Save-success dialog.
  saveSuccess: { mode: 'publish'; recipeId: string } | { mode: 'update' } | null;
  onSuccessPrimary: () => void;
  onCloseSuccess: () => void;
}
