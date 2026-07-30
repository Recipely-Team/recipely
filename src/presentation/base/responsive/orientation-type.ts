export const OrientationType = {
  Portrait: 'portrait',
  Landscape: 'landscape',
} as const;

// eslint-disable-next-line @typescript-eslint/no-redeclare -- intentional enum-style value + type pairing
export type OrientationType = (typeof OrientationType)[keyof typeof OrientationType];
