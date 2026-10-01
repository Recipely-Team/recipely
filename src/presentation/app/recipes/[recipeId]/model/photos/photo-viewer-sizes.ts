import { scale } from '@presentation/base/theme';

/**
 * Measurements only the recipe's photo viewer reads, as the prototype draws them.
 *
 * @remarks
 * - **`wideFrame` is a frame width, not a window width.** Past it the thumbs
 *   grow and the phone viewer shows its arrows — a tablet's frame, measured.
 * - **`blurRadius` is not scaled.** It is a filter strength, not a length on
 *   screen; `blurBleed` is, because it is how far the blurred copy overhangs
 *   the frame so its soft edge never shows.
 */
export const photoViewerSizes = {
  wideFrame: 560,
  blurRadius: 26,
  blurBleed: scale(30),
  topScrimHeight: scale(84),
  thumbWidth: scale(64),
  thumbWidthWide: scale(84),
  emptyLogo: scale(72),
  emptyLogoFramed: scale(84),
  addFirstOffset: scale(22),
  addFirstOffsetFramed: scale(28),
  /** The web credit line's height under the framed viewer; mobile uses the 44 touch target. */
  creditLineFramed: scale(28),
} as const;
