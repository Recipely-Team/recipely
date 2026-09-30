import { scale } from '@presentation/base/theme';

/**
 * The creator mark's sizes, as the prototype draws them (design-spec.md →
 * Creators). The plate grows with the avatar it sits on, so each surface
 * names its own.
 */
export const creatorMarkGeometry = {
  /** The platform glyph's share of its plate: 12 of 22 on the strip. */
  glyphShare: 0.55,
  /** On a 64 strip avatar. */
  strip: scale(22),
  /** On a 72 card avatar (phone /creators). */
  card: scale(24),
  /** On an 80 card avatar (expanded viewport). */
  wideCard: scale(26),
  /** Inside the verified handle chip. */
  chip: scale(24),
  /** Beside the handle on Edit Profile's claim card. */
  row: scale(28),
  /** Inside a platform option of the claim form. */
  option: scale(20),
  /** One strip item: the avatar and a little air for its name. */
  stripItemWidth: scale(72),
} as const;
