/**
 * The launch campaign's splash and dialog measurements, from the Claude Design board
 * "Board · Launch Campaign" (`src/launch-campaign.jsx`).
 *
 * @remarks
 * - **The splash tile matches the brand splash** (128 / 96), so the logo does not move when the
 *   brand gradient fades away and the campaign's shows through behind it.
 */
export const campaignSizes = {
  splashTile: 128,
  splashLogo: 96,
  splashTitleSize: 32,
  splashTitleLine: 40,
  splashSubtitleMaxWidth: 300,
  /** The splash art's column on a tablet or a wide window — the board draws it for a phone. */
  splashArtMaxWidth: 520,
  ctaMaxWidth: 360,
  ctaMinHeight: 52,
  ringSize: 28,
  ringRadius: 12,
  ringStroke: 2,
  heroHeight: 168,
  closeDisc: 32,
  closeGlyph: 16,
  dialogMarkWrap: 72,
  dialogMarkTile: 64,
  dialogLogo: 48,
  dialogMarkBorder: 4,
  dialogContentTop: 52,
  dialogMaxWidth: 400,
  /** The rise animation's starting offset. */
  riseOffset: 14,
  sheetRiseOffset: 24,
} as const;
