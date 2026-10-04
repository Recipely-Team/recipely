/** Where the Connect with Instagram button stands. */
export const InstagramConnectPhase = {
  Idle: 'idle',
  /** The login is open on Instagram's page, or its answer is being linked. */
  Waiting: 'waiting',
  /** The user closed the login or said no: nothing was linked. */
  Cancelled: 'cancelled',
} as const;

export type InstagramConnectPhaseType = (typeof InstagramConnectPhase)[keyof typeof InstagramConnectPhase];
