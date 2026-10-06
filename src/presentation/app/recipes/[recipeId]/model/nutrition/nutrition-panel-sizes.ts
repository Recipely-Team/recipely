import { radii, scale } from '@presentation/base/theme';
import { ValueConstants } from '@core/constants';

const SWITCH_INSET = scale(3);

/**
 * Measurements only the nutrition panel reads, as the prototype draws them.
 *
 * @remarks
 * - **Two ring sizes.** The web sidebar is narrower than a phone's content
 *   column once its padding is taken, so `compact` shrinks the ring and its
 *   stroke together.
 * - **Concentric corners.** An option's radius is the track's minus the inset,
 *   so the selected pill sits evenly inside the track.
 */
export const nutritionPanelSizes = {
  ring: scale(88),
  ringCompact: scale(76),
  ringStroke: scale(9),
  ringStrokeCompact: scale(8),
  barHeight: scale(4),
  barRadius: scale(ValueConstants.two),
  switchInset: SWITCH_INSET,
  switchRadius: radii.lg,
  optionRadius: radii.lg - SWITCH_INSET,
} as const;
