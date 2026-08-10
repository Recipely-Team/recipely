export const DevicePlatform = {
  Ios: 'ios',
  Android: 'android',
  Web: 'web',
} as const;

// eslint-disable-next-line @typescript-eslint/no-redeclare -- intentional enum-style value + type pairing
export type DevicePlatform = (typeof DevicePlatform)[keyof typeof DevicePlatform];
