export const HealthStatus = {
  Unknown: 'unknown',
  Connected: 'connected',
  Disconnected: 'disconnected',
} as const;

// eslint-disable-next-line @typescript-eslint/no-redeclare -- intentional enum-style value + type pairing
export type HealthStatus = (typeof HealthStatus)[keyof typeof HealthStatus];
