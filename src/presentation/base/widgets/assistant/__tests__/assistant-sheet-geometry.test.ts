import { assistantSheetGeometry } from '@presentation/base/widgets/assistant/assistant-sheet-geometry';
import { assistantMetrics } from '@presentation/base/widgets/assistant/assistant-metrics';

/**
 * "Asistanda klavye açılınca konuşma altta kalıyor."
 *
 * The typing sheet was pinned to `bottom: 0` and sized from the whole screen,
 * and nothing in the app read the keyboard at all — so raising the keyboard
 * put the transcript AND the box being typed into underneath it. On a phone
 * the keyboard is about half the screen, which is most of the sheet.
 */

const PHONE_HEIGHT = 800;
const KEYBOARD = 300;
const NO_KEYBOARD = 0;

describe('where the typing sheet sits', () => {
  it('stands off the bottom edge by the height of the keyboard', () => {
    // The whole bug in one assertion: at 0 the sheet is behind the keyboard.
    expect(assistantSheetGeometry(PHONE_HEIGHT, KEYBOARD).bottom).toBe(KEYBOARD);
  });

  it('rests on the bottom edge when there is no keyboard', () => {
    expect(assistantSheetGeometry(PHONE_HEIGHT, NO_KEYBOARD).bottom).toBe(NO_KEYBOARD);
  });

  // The share is taken from what the keyboard has LEFT. Lifting a sheet that
  // was measured against the whole screen is what pushes the orb — and the top
  // of the conversation — off the top edge.
  it('takes its share of the room left, not of the screen', () => {
    const { height } = assistantSheetGeometry(PHONE_HEIGHT, KEYBOARD);

    expect(height).toBeCloseTo(
      (PHONE_HEIGHT - KEYBOARD) * assistantMetrics.sheetHeightShare,
    );
  });

  it('leaves the resting layout exactly as it was', () => {
    expect(assistantSheetGeometry(PHONE_HEIGHT, NO_KEYBOARD).height).toBeCloseTo(
      PHONE_HEIGHT * assistantMetrics.sheetHeightShare,
    );
  });

  it('fits on the screen with the keyboard up', () => {
    const { bottom, height } = assistantSheetGeometry(PHONE_HEIGHT, KEYBOARD);

    expect(bottom + height).toBeLessThan(PHONE_HEIGHT);
  });

  // A landscape phone with the keyboard up leaves less than the share asks
  // for, and a sheet too short to type into is worse than one that overlaps.
  it('never shrinks below the composer', () => {
    const { height } = assistantSheetGeometry(400, 320);

    expect(height).toBe(assistantMetrics.sheetMinHeight);
  });
});
