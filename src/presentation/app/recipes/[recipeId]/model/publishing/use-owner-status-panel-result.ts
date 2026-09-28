import type { OwnerStatusType } from '@domain/recipes/publishing/owner-status';
import type { PublishBlockerType } from '@domain/recipes/publishing/publish-blocker';
import type { PanelConfirmType } from '@presentation/app/recipes/[recipeId]/model/publishing/panel-confirm';

/** What {@link useOwnerStatusPanel} hands the owner's status panel. */
export interface UseOwnerStatusPanelResult {
  status: OwnerStatusType;
  /** What a website import still needs; empty when nothing does. */
  blockers: readonly PublishBlockerType[];
  canPublish: boolean;
  /** Whether the cover is still a photo the owner could take off. */
  hasCover: boolean;
  isBusy: boolean;
  /** The confirmation on screen, or null. */
  confirm: PanelConfirmType | null;
  onRequestPublish: () => void;
  onRequestUnpublish: () => void;
  onConfirm: () => void;
  onCancelConfirm: () => void;
  /** Opens the editor on this recipe; it saves through PATCH. */
  onEdit: () => void;
  /** Takes the site's photo off: the cover, everywhere it appears. */
  onRemoveCover: () => void;
}
