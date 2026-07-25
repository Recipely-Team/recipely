import { scale } from '@presentation/base/theme/tokens/scale';

/**
 * Glyph sizes — the value handed to an `<Ionicons size={...} />` or to a
 * vector illustration. NOT the box the glyph sits in: a round icon button is
 * `controlSizes.iconBtn` with an `iconSizes.md` glyph inside it.
 *
 * NAMING: a strict t-shirt ladder, ascending, with no gaps and no role names.
 * The previous ad-hoc scale had `iconXxs` (18) larger than `iconSm` (16),
 * which is exactly the failure this ordering rules out — a reviewer can tell
 * two steps apart by their names alone. Reuse the nearest step rather than
 * inserting one: a 15pt and a 16pt glyph are not a distinction anyone sees.
 */
export const iconSizes = {
  /** Decorative micro-glyph (inline bullet dot). */
  xxs: scale(10),
  /** Sub-caption glyph. */
  xs: scale(12),
  /** Glyph inside a checkbox or a small badge. */
  sm: scale(14),
  /** The default inline glyph — caption rows, list affordances. */
  md: scale(16),
  /** Section-header and tab glyph. */
  lg: scale(18),
  /** Toolbar / nav-bar glyph. */
  xl: scale(20),
  /** Primary action glyph. */
  xxl: scale(24),
  /** Feature glyph inside a circular badge. */
  xxxl: scale(32),
  /** Oversized feature glyph. */
  huge: scale(40),
  /** Illustration-weight glyph. */
  massive: scale(48),
  /** Empty-state glyph. */
  jumbo: scale(56),
  /** Large empty-state / feedback glyph. */
  giant: scale(64),
  /** Full-bleed illustration mark (empty states, splash). */
  illustration: scale(140),
} as const;
