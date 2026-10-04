import { scale } from '@presentation/base/theme';

/** The Edit Profile creator card's own measurements (design spec §7, rev 2). */
export const CreatorAccountMetrics = {
  /** A Link row: a full-width target. */
  addRowMinHeight: scale(60),
  /** A row's action button side padding. */
  actionPadding: scale(18),
} as const;
