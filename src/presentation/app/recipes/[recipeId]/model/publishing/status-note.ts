import type { TranslationsType } from '@presentation/i18n';
import { OwnerStatus, type OwnerStatusType } from '@domain/recipes/publishing/owner-status';

/** The one line the owner's panel says about each state. Read lazily for the locale. */
export const statusNote: Record<OwnerStatusType, (t: TranslationsType) => string> = {
  [OwnerStatus.Private]: (t) => t.publishing.privateNote,
  [OwnerStatus.InReview]: (t) => t.publishing.inReviewNote,
  [OwnerStatus.Published]: (t) => t.publishing.publishedNote,
  [OwnerStatus.Rejected]: (t) => t.publishing.rejectedTitle,
};
