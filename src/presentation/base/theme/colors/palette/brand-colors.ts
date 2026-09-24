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
  /**
   * Instagram's gradient, corner to corner. Four stops, not three: the warm
   * orange between the yellow and the pink is what stops the sweep reading as
   * a flat magenta wash at ring width.
   */
  instagramGradientStart: '#F9CE34',
  instagramGradientWarm: '#EE583F',
  instagramGradientMid: '#EE2A7B',
  instagramGradientEnd: '#6228D7',
  /**
   * Instagram's colours as INK on the provenance seal's white face, not the
   * import card's plate: each stop is at least 3:1 on white, which the plate's
   * yellow is not.
   */
  instagramInkOrange: '#F56040',
  instagramInkPink: '#E1306C',
  instagramInkMagenta: '#C13584',
  instagramInkPurple: '#833AB4',
  /**
   * TikTok's note. The near-black carries the shape (18:1 on white); the red
   * echo is 3.9:1 and the cyan one is decoration only, as in TikTok's own mark.
   */
  tiktokNote: '#121212',
  tiktokCyan: '#25F4EE',
  tiktokRed: '#FE2C55',
  /** The AI sparkles' indigo-to-teal ink, both stops at least 3:1 on white. */
  aiInkIndigo: '#4F46E5',
  aiInkTeal: '#0E7490',
  /**
   * The seal's ring over a photo: slate at 62%, about #6A6F7B over white — 5.1:1
   * against a white pixel, while the white face gives 21:1 against a black one.
   */
  sealRing: 'rgba(15,23,42,0.62)',
  /** The hairline between two marks in one capsule. */
  sealDivider: 'rgba(15,23,42,0.18)',
} as const;
