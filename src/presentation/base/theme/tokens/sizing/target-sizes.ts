/**
 * Pointer-target floors. Unscaled on purpose: WCAG 2.2 AA (2.5.8) states the
 * minimum in CSS pixels, so it must not shrink with the device scale.
 */
export const targetSizes = {
  /** The smallest box any pressable may have. */
  min: 24,
} as const;
