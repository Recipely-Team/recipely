/**
 * Hex alpha suffixes appended to a `#RRGGBB` theme colour to tint it —
 * `colors.primary + colorAlphas.faint`.
 *
 * Separate from `opacities` on purpose: an `opacity` style fades a whole view
 * and everything drawn inside it, while these fade only the colour they are
 * concatenated onto. Reach for a suffix when a fill or border should be
 * translucent but its label must stay at full strength.
 */
export const colorAlphas = {
  /** ~9% — a tinted fill that barely departs from the surface beneath it. */
  faint: '18',
  /** 25% — a tinted border on that fill. */
  soft: '40',
  /** 40% — an inactive indicator sitting over media. */
  medium: '66',
  /** Frosted: a surface you can just see the page through, for glass over live content. */
  frosted: 'E6',
} as const;
