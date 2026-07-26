import { scale } from '@presentation/base/theme/tokens/scale';

/**
 * The single gap ladder: every margin, padding and flex `gap` in the app picks
 * a step from here. Steps ascend monotonically and are device-scaled, so a
 * layout keeps its proportions on a 320pt phone and a 430pt one alike.
 *
 * NAMING: t-shirt sizes, and a `2` suffix means "one notch above the step it
 * follows" (`xs2` sits between `xs` and `sm`). Never introduce a role name
 * here — `spacing.cardGutter` would be a measurement that only one screen can
 * reuse. Pick the closest existing step instead of adding one.
 */
export const spacing = {
  xxs: scale(2),
  xs: scale(4),
  xs2: scale(6),
  sm: scale(8),
  sm2: scale(10),
  md: scale(12),
  lg: scale(16),
  lg2: scale(20),
  xl: scale(24),
  xxl: scale(32),
  xxxl: scale(48),
} as const;
