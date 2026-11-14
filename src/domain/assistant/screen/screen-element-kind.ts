/** What a registered piece of the screen is: words to read, or a control to press. */
export const ScreenElementKind = {
  Text: 'text',
  Control: 'control',
} as const;

// eslint-disable-next-line @typescript-eslint/no-redeclare -- intentional enum-style value + type pairing
export type ScreenElementKind = (typeof ScreenElementKind)[keyof typeof ScreenElementKind];
