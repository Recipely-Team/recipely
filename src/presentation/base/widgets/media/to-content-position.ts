import type { ImageContentPosition } from 'expo-image';
import type { FocalPoint } from '@domain/recipes/media/focal-point';
import { CharConstants } from '@core/constants';

/** A focal point is a share of the frame; expo-image positions by percentage. */
const PERCENT_SCALE = 100;
const CENTRED: ImageContentPosition = 'center';

/**
 * Where a `cover` crop sits: on the photo's focal point, or centred without one.
 *
 * Percentages behave like CSS `object-position` — the photo's `x%` point is
 * aligned with the frame's `x%` point — so the dish stays in view however the
 * frame's shape crops the photo, and an edge focus never uncovers the backdrop.
 * Whole percents: a finer step is invisible, and `0.07 * 100` is `7.000000000000001`.
 */
export const toContentPosition = (focus: FocalPoint | undefined): ImageContentPosition =>
  focus === undefined
    ? CENTRED
    : {
        left: `${Math.round(focus.x * PERCENT_SCALE)}${CharConstants.percent}`,
        top: `${Math.round(focus.y * PERCENT_SCALE)}${CharConstants.percent}`,
      };
