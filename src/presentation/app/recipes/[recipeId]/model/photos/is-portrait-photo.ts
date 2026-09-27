/** How much narrower than its frame a photo may be before a crop would lose its subject. */
const PORTRAIT_SLACK = 0.78;

/**
 * Whether the hero should show a photo whole instead of cropping it.
 *
 * @remarks
 * - **Both ratios are measured.** The photo's from its decoded pixels, the
 *   frame's from layout — the frame is wider than 4:3 once the height cap
 *   applies, so assuming 4:3 would crop exactly the photos this protects.
 * - **Unknown is not portrait.** Until both are known the photo is cropped,
 *   which is what a landscape photo — the common case — wants anyway.
 */
export const isPortraitPhoto = (photoRatio: number | null, frameRatio: number | null): boolean =>
  photoRatio !== null && frameRatio !== null && photoRatio < frameRatio * PORTRAIT_SLACK;
