import { ConfirmSheet } from '@presentation/base/widgets/sheets/confirm-sheet';
import { DeleteRecipeSheet } from '@presentation/app/recipes/[recipeId]/sheets/delete-recipe-sheet';
import { FeedbackDialog } from '@presentation/base/widgets/dialogs/feedback-dialog';
import { SignInPromptSheet } from '@presentation/base/widgets/sheets/sign-in-prompt-sheet';
import { t } from '@presentation/i18n';
import { CharConstants } from '@core/constants';
import type { MediaItem } from '@domain/recipes/media/media-item';

export interface RecipeDetailSheetsProps {
  unsavePending: boolean;
  onConfirmUnsave: () => void;
  onCancelUnsave: () => void;
  /** The photo the owner asked to remove, or null when nothing is pending. */
  photoPendingRemoval: MediaItem | null;
  onConfirmRemovePhoto: () => void;
  onCancelRemovePhoto: () => void;
  /** A localized sentence when a photo could not be added or removed. */
  photoError: string | null;
  onDismissPhotoError: () => void;
  /** True while the "Delete this comment?" question is open. */
  commentDeletePending: boolean;
  onConfirmDeleteComment: () => void;
  onCancelDeleteComment: () => void;
  showDeleteSheet: boolean;
  deleteError: string | null;
  isDeleting: boolean;
  onCloseDelete: () => void;
  onConfirmDelete: () => void;
  promptVisible: boolean;
  /** Absent when nothing raised the prompt; the sheet renders its own default. */
  promptMessage: string | undefined;
  onClosePrompt: () => void;
  onGoToSignIn: () => void;
}

/**
 * Every question the recipe screen can ask, in one place.
 *
 * @remarks
 * - **Why they moved out.** The screen is composition, and four sheets inline
 *   put it over the 300-line guard rule 18 sets. None of them holds state — the
 *   screen owns that and passes the answers back — so they travel together
 *   without dragging anything with them.
 * - **A refused photo is a DIALOG, not a toast.** The server looks at a photo
 *   before it stores it, so "that picture cannot go up" is something the user
 *   has to read and act on; a toast that scrolls away is how a refusal becomes
 *   "the button does nothing". The avatar upload makes the same call.
 * - **Removing a photo asks first.** It is the owner's own picture, and it may
 *   also be the only one the recipe has. Deleting a comment asks too: it cannot
 *   be undone.
 */
export const RecipeDetailSheets = (props: RecipeDetailSheetsProps): React.JSX.Element => (
  <>
    <ConfirmSheet
      visible={props.unsavePending}
      title={t().assistant.unsaveTitle}
      message={t().assistant.unsaveMessage}
      confirmLabel={t().assistant.unsaveConfirm}
      onConfirm={props.onConfirmUnsave}
      onClose={props.onCancelUnsave}
    />

    <ConfirmSheet
      visible={props.photoPendingRemoval !== null}
      title={t().photoViewer.removeA11y}
      message={t().recipes.removePhotoConfirm}
      confirmLabel={t().photoViewer.remove}
      destructive
      onConfirm={props.onConfirmRemovePhoto}
      onClose={props.onCancelRemovePhoto}
    />

    <FeedbackDialog
      visible={props.photoError !== null}
      title={t().recipes.addPhoto}
      message={props.photoError ?? CharConstants.empty}
      primaryLabel={t().common.ok}
      onPrimary={props.onDismissPhotoError}
      onClose={props.onDismissPhotoError}
    />

    <ConfirmSheet
      visible={props.commentDeletePending}
      title={t().comments.delete}
      message={t().comments.deleteConfirm}
      confirmLabel={t().comments.delete}
      destructive
      onConfirm={props.onConfirmDeleteComment}
      onClose={props.onCancelDeleteComment}
    />

    <DeleteRecipeSheet
      visible={props.showDeleteSheet}
      deleteError={props.deleteError}
      isDeleting={props.isDeleting}
      onClose={props.onCloseDelete}
      onConfirm={props.onConfirmDelete}
    />

    <SignInPromptSheet
      visible={props.promptVisible}
      onClose={props.onClosePrompt}
      onSignIn={props.onGoToSignIn}
      message={props.promptMessage}
    />
  </>
);
