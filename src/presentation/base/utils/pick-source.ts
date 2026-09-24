export const PickSource = {
  Camera: 'camera',
  Library: 'library',
} as const;

// eslint-disable-next-line @typescript-eslint/no-redeclare -- intentional enum-style value + type pairing
export type PickSource = (typeof PickSource)[keyof typeof PickSource];
