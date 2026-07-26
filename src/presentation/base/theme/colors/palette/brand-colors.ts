/**
 * Fixed third-party brand colors. Unlike theme colors these never vary by the
 * light/dark scheme — the Apple sign-in button is always black (Apple HIG) and
 * the Google mark is always Google's four hues — so they live here as constants
 * rather than as theme tokens that flip. Referenced instead of hard-coding a
 * bare hex on a brand surface.
 */
export const BrandColors = {
  /** Neutral fixed white for brand surfaces and marks (never theme-tinted). */
  white: '#FFFFFF',
  /** Apple sign-in button surface. */
  black: '#000000',
  /** Google sign-in button label ink. */
  googleLabel: '#1F2937',
  googleBlue: '#4285F4',
  googleRed: '#EA4335',
  googleGreen: '#34A853',
  googleYellow: '#FBBC05',
} as const;
