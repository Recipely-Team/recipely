/** How a {@link PillButton} is drawn. */
export const PillButtonTone = {
  /** `primary` fill, `primaryText` label — the one action a card leads with. */
  Primary: 'primary',
  /** Hairline `border`, `text` label, no fill — a secondary action beside it. */
  Outline: 'outline',
  /** Hairline `border`, danger label — withdrawing or removing something. */
  Danger: 'danger',
} as const;

export type PillButtonToneType = (typeof PillButtonTone)[keyof typeof PillButtonTone];
