/**
 * Gradient geometry for the web hero card overlay.
 *
 * `locations` maps 1:1 onto the four `HERO_OVERLAY_*` colours in
 * `web-hero-constants.ts`: the overlay stays deep until 45%, then fades out by
 * 80% so the headline keeps contrast while the photo stays visible on the
 * right. The two files sit side by side on purpose — stops and colours are one
 * gradient, and splitting them across layers (geometry in `base/constants`,
 * colours here) is how they drift.
 */
export const HeroGradientConstants = {
  // Tuple-typed: LinearGradient's `locations` requires at least two stops.
  locations: [0, 0.45, 0.8, 1] as readonly [number, number, ...number[]],
  /** Bottom-left origin. */
  start: { x: 0.15, y: 1 } as const,
  /** Top-right terminus. */
  end: { x: 0.85, y: 0 } as const,
} as const;
