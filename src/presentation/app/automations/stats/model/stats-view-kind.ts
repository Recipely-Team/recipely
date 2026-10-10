/** Which state the creator stats screen draws (spec "States"). */
export const StatsViewKind = {
  Loading: 'loading',
  Unavailable: 'unavailable',
  Locked: 'locked',
  Error: 'error',
  NoAutomations: 'noAutomations',
  NoSends: 'noSends',
  Stats: 'stats',
} as const;

export type StatsViewKindType = (typeof StatsViewKind)[keyof typeof StatsViewKind];
