export const TaxonomyStatus = {
  Idle: 'idle', // TO DO: static status name problem
  Loading: 'loading', // TO DO: static status name problem
  Ready: 'ready', // TO DO: static status name problem
  Error: 'error', // TO DO: static status name problem
} as const;

// eslint-disable-next-line @typescript-eslint/no-redeclare -- intentional enum-style value + type pairing
export type TaxonomyStatus = (typeof TaxonomyStatus)[keyof typeof TaxonomyStatus];
