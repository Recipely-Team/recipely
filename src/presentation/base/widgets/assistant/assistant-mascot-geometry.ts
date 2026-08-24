/**
 * The chef, as coordinates.
 *
 * @remarks
 * - **One drawing, not a set of design measurements.** These numbers only mean
 *   anything relative to each other inside `viewBox`, which is why they are a
 *   drawing's data rather than tokens: scaling the mascot changes the rendered
 *   size and leaves every number here untouched.
 * - **Ported from the approved prototype unchanged.** The face reads as a chef
 *   because of where the hat's three puffs overlap the head, so the values are
 *   copied rather than re-derived.
 */
export const mascotGeometry = {
  viewBox: 64,
  face: { cx: 32, cy: 40, r: 16 },
  cheeks: { left: 21, right: 43, cy: 44, rx: 3.2, ry: 2.2 },
  eyes: { left: 26, right: 38, cy: 39, r: 2.3 },
  /** The eye at the bottom of a blink — never 0, which reads as a glitch rather than a blink. */
  eyeClosed: 0.3,
  smile: 'M27.5 46.5c1.6 2 5.4 2 7 0',
  mouth: { cx: 32, cy: 47.5, rx: 4.2, ry: 3.4 },
  hatPuffs: [
    { cx: 22, cy: 21, r: 9 },
    { cx: 42, cy: 21, r: 9 },
    { cx: 32, cy: 15, r: 11.5 },
  ],
  hatBand: { x: 19, y: 25, width: 26, height: 8, rx: 4 },
  faceTop: '#F8DCBB',
  faceBottom: '#EFC08F',
  cheek: '#E98A6A',
  eye: '#3B2A1E',
  mouthFill: '#B4483C',
  hat: '#FFFFFF',
  bandShade: '#000000',
  cheekOpacity: 0.4,
  bandShadeOpacity: 0.06,
  smileWidth: 2,
} as const;
