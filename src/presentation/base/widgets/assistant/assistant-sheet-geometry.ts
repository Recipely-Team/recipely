import { assistantMetrics } from '@presentation/base/widgets/assistant/assistant-metrics';

/** Where the typing sheet sits, and how tall it is. Only its own module names it. */
interface SheetGeometry {
  /** How far the sheet's bottom edge stands off the bottom of the screen. */
  bottom: number;
  height: number;
}

/**
 * The typing sheet's place on screen, with the keyboard wherever it is.
 *
 * @remarks
 * - **Why it moved out of the component.** The sheet was `bottom: 0` with a
 *   height taken from the whole screen, and nothing anywhere read the keyboard
 *   — so opening it buried the conversation and the box being typed into
 *   underneath the keyboard. On a phone that is most of the sheet.
 * - **The share is of what is LEFT, not of the screen.** Measuring 46% of the
 *   screen and then lifting it by the keyboard is what pushes the orb off the
 *   top: with a keyboard up, the room is the screen minus the keyboard, and
 *   the sheet takes its share of that. With no keyboard the two are the same
 *   number, so nothing about the resting layout changes.
 * - **A floor, because a short window is still a window.** A landscape phone
 *   with the keyboard up leaves so little that the proportional height would
 *   not fit the composer, and a sheet you cannot type into is worse than one
 *   that overlaps.
 */
export const assistantSheetGeometry = (
  screenHeight: number,
  keyboardHeight: number,
): SheetGeometry => {
  const room = screenHeight - keyboardHeight;

  return {
    bottom: keyboardHeight,
    height: Math.max(
      assistantMetrics.sheetMinHeight,
      room * assistantMetrics.sheetHeightShare,
    ),
  };
};
