/** Where cook mode is in a recipe's steps, and how to move. */
export interface StepNavigation {
  /** Zero-based index of the step on screen. */
  index: number;
  isFirst: boolean;
  isLast: boolean;
  /** Moves to a zero-based step, clamped; false when it did not move. */
  goTo: (target: number) => boolean;
  next: () => boolean;
  previous: () => boolean;
}
