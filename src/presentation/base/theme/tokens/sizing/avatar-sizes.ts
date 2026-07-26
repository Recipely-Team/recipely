import { scale } from '@presentation/base/theme/tokens/scale';

/**
 * Avatar diameters. A clean t-shirt ladder plus the two ring frames, which
 * pair a frame with the inner avatar it encloses — the gap between them is the
 * visible ring, so the two values only ever change together.
 */
export const avatarSizes = {
  /** Byline avatar inside a stats row. */
  xs: scale(32),
  /** List-row avatar. */
  sm: scale(36),
  /** Card / notification avatar. */
  md: scale(40),
  /** Sheet header avatar. */
  lg: scale(56),
  /** Feature avatar. */
  xl: scale(80),
  /** Profile screen ring frame. */
  frame: scale(112),
  /** Avatar inside {@link frame}. */
  frameInner: scale(106),
  /** Edit-profile ring frame. */
  editFrame: scale(110),
  /** Avatar inside {@link editFrame}. */
  editFrameInner: scale(104),
} as const;
