export const TaxonomyStatus = {
  Idle: 'idle',
  Loading: 'loading',
  Ready: 'ready',
  Error: 'error',
} as const;

// eslint-disable-next-line @typescript-eslint/no-redeclare -- intentional enum-style value + type pairing
export type TaxonomyStatus = (typeof TaxonomyStatus)[keyof typeof TaxonomyStatus];
