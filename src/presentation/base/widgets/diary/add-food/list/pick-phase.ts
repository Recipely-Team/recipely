/** The faces of the pick step's list area (Add food v2 spec §4). */
export const PickPhase = {
  /** First page on its way: skeleton rows. */
  Loading: 'loading',
  /** Every first page failed: the message with "Try again". */
  Error: 'error',
  /** Everything answered and nothing matched. */
  Empty: 'empty',
  Ready: 'ready',
} as const;

export type PickPhaseType = (typeof PickPhase)[keyof typeof PickPhase];
