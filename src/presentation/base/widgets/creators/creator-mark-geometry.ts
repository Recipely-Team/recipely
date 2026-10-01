import { scale } from '@presentation/base/theme';

/**
 * The creator seal's and badge's sizes, as the Recipely Prototype draws them
 * (design-spec.md → Creators + Recipely Kitchen).
 */
export const creatorMarkGeometry = {
  /** The platform glyph's share of its white face, as on the provenance seal. */
  glyphShare: 0.6,
  /** On a 64 avatar (strip and card): max(20, round(64 × 0.34)). */
  avatar: scale(22),
  /** Inside the verified platform badge and the neutral handle chip. */
  chip: scale(22),
  /** Inside a platform option of the claim form. */
  option: scale(24),
  /** One strip item: the 64 avatar and a little air for its name. */
  stripItemWidth: scale(76),
  /** The approved-creator badge beside the name on the phone's Profile. */
  badgeProfile: scale(22),
  /** The same badge beside the web Profile's heading. */
  badgeProfileWeb: scale(20),
  /** The same badge beside the Approved status title on Edit Profile. */
  badgeStatus: scale(18),
  /** The badge's check as a share of the badge. */
  badgeCheckShare: 0.62,
} as const;
