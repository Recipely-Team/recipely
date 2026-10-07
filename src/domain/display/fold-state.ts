/**
 * How far the device is opened. `Flat` is fully open (or a dual-screen device
 * lying flat); `HalfOpened` is the book or tabletop posture.
 */
export const FoldState = {
  Flat: 'flat',
  HalfOpened: 'halfOpened',
} as const;

export type FoldStateType = (typeof FoldState)[keyof typeof FoldState];
