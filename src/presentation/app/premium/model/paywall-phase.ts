/** Where the paywall is: loading the plans, ready, in the store sheet, restoring, or without a store. */
export const PaywallPhase = {
  Loading: 'loading',
  Ready: 'ready',
  Purchasing: 'purchasing',
  Restoring: 'restoring',
  Unavailable: 'unavailable',
} as const;

// eslint-disable-next-line @typescript-eslint/no-redeclare -- intentional enum-style value + type pairing
export type PaywallPhase = (typeof PaywallPhase)[keyof typeof PaywallPhase];
