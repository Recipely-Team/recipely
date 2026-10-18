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
const NO_INSET = 0;
/** Android's 3-button navigation bar, in dp. */
const NAV_BAR = 48;

describe('where the typing sheet sits', () => {
  it('stands off the bottom edge by the height of the keyboard', () => {
    // The whole bug in one assertion: at 0 the sheet is behind the keyboard.
    expect(assistantSheetGeometry(PHONE_HEIGHT, KEYBOARD, NO_INSET).bottom).toBe(KEYBOARD);
  });

  it('rests on the bottom edge when there is no keyboard', () => {
    expect(assistantSheetGeometry(PHONE_HEIGHT, NO_KEYBOARD, NO_INSET).bottom).toBe(NO_KEYBOARD);
  });

  // The share is taken from what the keyboard has LEFT. Lifting a sheet that
  // was measured against the whole screen is what pushes the orb — and the top
  // of the conversation — off the top edge.
  it('takes its share of the room left, not of the screen', () => {
    const { height } = assistantSheetGeometry(PHONE_HEIGHT, KEYBOARD, NO_INSET);

    expect(height).toBeCloseTo(
      (PHONE_HEIGHT - KEYBOARD) * assistantMetrics.sheetHeightShare,
    );
  });

  it('leaves the resting layout exactly as it was', () => {
    expect(assistantSheetGeometry(PHONE_HEIGHT, NO_KEYBOARD, NO_INSET).height).toBeCloseTo(
      PHONE_HEIGHT * assistantMetrics.sheetHeightShare,
    );
  });

  it('fits on the screen with the keyboard up', () => {
    const { bottom, height } = assistantSheetGeometry(PHONE_HEIGHT, KEYBOARD, NO_INSET);

    expect(bottom + height).toBeLessThan(PHONE_HEIGHT);
  });

  // A landscape phone with the keyboard up leaves less than the share asks
  // for, and a sheet too short to type into is worse than one that overlaps.
  it('never shrinks below the composer', () => {
    const { height } = assistantSheetGeometry(400, 320, NO_INSET);

    expect(height).toBe(assistantMetrics.sheetMinHeight);
  });
});

/**
 * "Alttaki yönlendirme çubuğunu dikkate almıyoruz … tıklanamıyor butonlar":
 * on a phone with the 3-button navigation bar the composer sat under the bar,
 * which takes every touch, so the box could not be tapped and the keyboard
 * never opened.
 */
describe('the typing sheet above a navigation bar', () => {
  it('keeps its contents above the bar while the keyboard is down', () => {
    expect(assistantSheetGeometry(PHONE_HEIGHT, NO_KEYBOARD, NAV_BAR).paddingBottom).toBe(NAV_BAR);
  });

  it('grows by the bar instead of shrinking the conversation', () => {
    const plain = assistantSheetGeometry(PHONE_HEIGHT - NAV_BAR, NO_KEYBOARD, NO_INSET);

    expect(assistantSheetGeometry(PHONE_HEIGHT, NO_KEYBOARD, NAV_BAR).height).toBeCloseTo(plain.height + NAV_BAR);
  });

  it('drops the clearance when the keyboard is up, because the keyboard covers the bar', () => {
    expect(assistantSheetGeometry(PHONE_HEIGHT, KEYBOARD, NAV_BAR).paddingBottom).toBe(NO_INSET);
  });
});
