import { OwnerStatus, type OwnerStatusType } from '@domain/recipes/publishing/owner-status';
import { t } from '@presentation/i18n';

/**
 * The short line a publish or unpublish ends on, by where the recipe landed.
 * Read lazily: `t()` follows the active locale.
 */
export const ownerStatusToast: Record<OwnerStatusType, () => string> = {
  [OwnerStatus.Private]: () => t().publishing.toastPrivate,
  [OwnerStatus.InReview]: () => t().publishing.toastInReview,
  [OwnerStatus.Published]: () => t().publishing.toastPublished,
  [OwnerStatus.Rejected]: () => t().publishing.toastRejected,
};
