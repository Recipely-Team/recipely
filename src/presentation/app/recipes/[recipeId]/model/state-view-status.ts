export const StateViewStatus = {
  Loading: 'loading',
  Error: 'error',
  Empty: 'empty',
  Content: 'content',
} as const;

// eslint-disable-next-line @typescript-eslint/no-redeclare -- intentional enum-style value + type pairing
export type StateViewStatus = (typeof StateViewStatus)[keyof typeof StateViewStatus];
