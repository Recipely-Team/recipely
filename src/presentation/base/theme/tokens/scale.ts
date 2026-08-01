import { Dimensions, PixelRatio } from 'react-native';
import { isWeb } from '@infrastructure/constants/platform';

/**
 * Logical width of the device the visual design was drawn against
 * (iPhone 11 Pro / 375pt). Every measurement token is authored at this width,
 * so a number read off a design file can be typed verbatim and this module
 * adapts it to the device actually running the app.
 */
const BASELINE_WIDTH = 375;

/**
 * Lower bound of {@link SCALE_FACTOR}. A phone narrower than the baseline never
 * shrinks past this — a 44pt tap target survives ×0.9, below that it stops
 * meeting the HIG/Material minimum.
 */
const MIN_FACTOR = 0.9;

/**
 * Upper bound of {@link SCALE_FACTOR}. Past a tablet-sized viewport the layout
 * wants more columns, not bigger controls; that is what the breakpoints in
 * `@presentation/base/responsive/breakpoints` decide.
 */
const MAX_FACTOR = 1.12;

/**
 * Share of the raw factor that typography takes. Text scales at half strength:
 * at full strength a tablet turns body copy into headlines, and the OS
 * accessibility font scale already multiplies on top of whatever we emit.
 */
const FONT_DAMPING = 0.5;

/** The identity factor — "same as the baseline design". */
const NEUTRAL_FACTOR = 1;

const clamp = (value: number, min: number, max: number): number =>
  Math.min(Math.max(value, min), max);

/**
 * Ratio between this device's shortest viewport edge and the design baseline.
 *
 * Read once at module load from the SHORTEST edge rather than the current
 * width, so the value is orientation-independent — rotating a phone must not
 * resize every control on screen. Always neutral on web: the web build adapts
 * through breakpoints and a desktop viewport would otherwise inflate the whole
 * UI (and a module-load read cannot follow a browser resize anyway).
 */
export const SCALE_FACTOR: number = ((): number => {
  if (isWeb()) return NEUTRAL_FACTOR;
  const { width, height } = Dimensions.get('window');
  return clamp(Math.min(width, height) / BASELINE_WIDTH, MIN_FACTOR, MAX_FACTOR);
})();

/**
 * Adapts a layout measurement (spacing, radius, control box, image height)
 * authored at {@link BASELINE_WIDTH} to the current device.
 *
 * Snapped to the device pixel grid so scaled borders and 1px dividers stay
 * crisp instead of landing on a fractional pixel.
 */
export const scale = (value: number): number =>
  PixelRatio.roundToNearestPixel(value * SCALE_FACTOR);

/**
 * Adapts a typographic measurement at {@link FONT_DAMPING} strength.
 *
 * Font sizes must move less than boxes: the OS font-scale setting multiplies
 * whatever we return, so a full-strength device factor would compound into
 * unreadably large text on a large phone with accessibility sizing on.
 */
export const scaleFont = (value: number): number =>
  PixelRatio.roundToNearestPixel(
    value * (NEUTRAL_FACTOR + (SCALE_FACTOR - NEUTRAL_FACTOR) * FONT_DAMPING),
  );
