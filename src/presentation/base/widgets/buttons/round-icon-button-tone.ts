/** How a {@link RoundIconButton} is filled. */
export const RoundIconButtonTone = {
  /** `primary` fill, `primaryText` glyph — the one action a row leads with. */
  Primary: 'primary',
  /** `surface` fill with a hairline `cardBorder` — header and stepper controls. */
  Outlined: 'outlined',
} as const;

export type RoundIconButtonToneType = (typeof RoundIconButtonTone)[keyof typeof RoundIconButtonTone];
