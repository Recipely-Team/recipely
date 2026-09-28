import { OwnerStatus, type OwnerStatusType } from '@domain/recipes/publishing/owner-status';
import { t } from '@presentation/i18n';

/** The one line the owner's panel says about each state. Read lazily for the locale. */
export const statusNote: Record<OwnerStatusType, () => string> = {
  [OwnerStatus.Private]: () => t().publishing.privateNote,
  [OwnerStatus.InReview]: () => t().publishing.inReviewNote,
  [OwnerStatus.Published]: () => t().publishing.publishedNote,
  [OwnerStatus.Rejected]: () => t().publishing.rejectedTitle,
};
