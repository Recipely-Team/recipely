import { OwnerStatus, type OwnerStatusType } from '@domain/recipes/publishing/owner-status';
import type { IoniconName } from '@presentation/base/errors/ionicon-name';
import { t } from '@presentation/i18n';

/**
 * The icon and short word for each owner state — the Created tab's badge and
 * the owner's status panel draw from the same vocabulary. Labels read lazily,
 * so they follow the active locale.
 */
export const ownerStatusLook: Record<OwnerStatusType, { icon: IoniconName; label: () => string }> = {
  [OwnerStatus.Private]: { icon: 'lock-closed', label: () => t().publishing.statusPrivate },
  [OwnerStatus.InReview]: { icon: 'time-outline', label: () => t().publishing.statusInReview },
  [OwnerStatus.Published]: { icon: 'globe-outline', label: () => t().publishing.statusPublished },
  [OwnerStatus.Rejected]: { icon: 'alert-circle', label: () => t().publishing.statusRejected },
};
