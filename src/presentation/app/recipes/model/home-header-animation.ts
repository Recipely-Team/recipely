/**
 * The output ranges the collapsing home header interpolates over.
 *
 * @remarks
 * - **Named as whole arrays, not element by element.** A scroll animation is
 *   read as a pair — where it starts and where it lands — and half-substituting
 *   one end (`[ValueConstants.one, 0.82]`) hides the interesting number behind
 *   the boring one. CLAUDE.md rule 5 asks for the sequence to carry the name.
 * - **The search field fades but never disappears.** Its floor is deliberately
 *   above zero: a control the user can still see is a control they know is
 *   there, and the band comes back the moment they scroll up.
 * - **Input ranges stay at the call site**, because each is built from
 *   `layoutSizes.homeTitleShrink` — the distance is a layout measurement and
 *   belongs to the theme, not here.
 */
export const HomeHeaderAnimation = {
  /** Title scale, full size down to slightly tucked. */
  titleScale: [1, 0.82],
  /** Eyebrow opacity, fully faded by {@link midpoint} of the shrink distance. */
  eyebrowOpacity: [1, 0],
  /** Search-field opacity — dimmed, never hidden. */
  searchOpacity: [1, 0.55],
  /** Share of the shrink distance at which the eyebrow has finished fading. */
  midpoint: 0.5,
} as const;
