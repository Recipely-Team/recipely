/** The ideas step's loading: the first page, a further page, settled with more to ask for, or at the end. */
export const IdeasLoad = {
  First: 'first',
  More: 'more',
  Idle: 'idle',
  Exhausted: 'exhausted',
} as const;

export type IdeasLoadType = (typeof IdeasLoad)[keyof typeof IdeasLoad];
