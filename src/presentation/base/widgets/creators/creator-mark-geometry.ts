import { scale } from '@presentation/base/theme';

/**
 * The creator seal's and badge's sizes, as the Recipely Prototype draws them
 * (design-spec.md → Creators + Recipely Kitchen).
 */
export const creatorMarkGeometry = {
  /** The platform glyph's share of its white face, as on the provenance seal. */
  glyphShare: 0.6,
  /** On a card's 64 avatar: max(20, round(64 × 0.34)). */
  avatar: scale(22),
  /** Inside the verified platform badge and the neutral handle chip. */
  chip: scale(22),
  /** How far a second seal sits from the primary, as a share of a seal: 13 at 22. */
  overlapShare: 0.6,
  /** Beside each handle line on a creator card. */
  cardLine: scale(18),
  /** At the head of an Edit Profile platform row and its Link row. */
  row: scale(36),
  /** Beside the title of the Edit Profile link form. */
  form: scale(28),
  /** The approved-creator badge beside the name on the phone's Profile. */
  badgeProfile: scale(22),
  /** The same badge beside the web Profile's heading. */
  badgeProfileWeb: scale(20),
  /** The badge's check as a share of the badge. */
  badgeCheckShare: 0.62,
} as const;
