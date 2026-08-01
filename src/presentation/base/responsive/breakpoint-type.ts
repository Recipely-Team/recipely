export const BreakpointType = {
  Mobile: 'mobile',
  Tablet: 'tablet',
  Desktop: 'desktop',
  Wide: 'wide',
} as const;

// eslint-disable-next-line @typescript-eslint/no-redeclare -- intentional enum-style value + type pairing
export type BreakpointType = (typeof BreakpointType)[keyof typeof BreakpointType];
