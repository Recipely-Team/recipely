/**
 * Widths of the Recipely logo. Deliberately unscaled — the brand mark keeps its
 * drawn size on every device — so it is not one of the scaled sizing ladders.
 */
export const brandMarkSizes = {
  /** `RecipelyLogo` when no size is passed. */
  default: 64,
  /** The login hero on a phone. */
  hero: 72,
  /** The login hero in the landscape / web shell. */
  heroLandscape: 96,
  /** The update-required gate's app mark on a tablet (a phone uses `heroLandscape`). */
  updateGateTablet: 112,
} as const;
