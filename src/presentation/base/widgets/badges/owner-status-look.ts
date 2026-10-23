import type { TranslationsType } from '@presentation/i18n';
import { OwnerStatus, type OwnerStatusType } from '@domain/recipes/publishing/owner-status';
import type { IoniconNameType } from '@presentation/base/errors/ionicon-name';

/**
 * The icon and short word for each owner state — the Created tab's badge and
 * the owner's status panel draw from the same vocabulary. Labels read lazily,
 * so they follow the active locale.
 */
export const ownerStatusLook: Record<OwnerStatusType, { icon: IoniconNameType; label: (t: TranslationsType) => string }> = {
  [OwnerStatus.Private]: { icon: 'lock-closed', label: (t) => t.publishing.statusPrivate },
  [OwnerStatus.InReview]: { icon: 'time-outline', label: (t) => t.publishing.statusInReview },
  [OwnerStatus.Published]: { icon: 'globe-outline', label: (t) => t.publishing.statusPublished },
  [OwnerStatus.Rejected]: { icon: 'alert-circle', label: (t) => t.publishing.statusRejected },
};
