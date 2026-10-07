/**
 * Which way the fold or hinge line runs. `Vertical` is a book: panes left and
 * right. `Horizontal` is a laptop or tabletop: panes top and bottom.
 */
export const FoldOrientation = {
  Vertical: 'vertical',
  Horizontal: 'horizontal',
} as const;

export type FoldOrientationType = (typeof FoldOrientation)[keyof typeof FoldOrientation];
