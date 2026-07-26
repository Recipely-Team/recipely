import { scale } from '@presentation/base/theme/tokens/scale';

/**
 * Corner-radius ladder. Steps ascend monotonically; `round` is the pill/circle
 * sentinel — a value large enough that React Native clamps it to half the box,
 * which is why it is the one step that is NOT device-scaled (scaling a
 * sentinel would be meaningless).
 */
export const radii = {
  xs: scale(4),
  sm: scale(6),
  md: scale(8),
  lg: scale(12),
  xl: scale(16),
  xxl: scale(24),
  xxl2: scale(28),
  xxxl: scale(32),
  round: 9999,
} as const;
