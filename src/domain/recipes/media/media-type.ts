export const MediaType = {
  Image: 'image',
  Video: 'video',
} as const;

// eslint-disable-next-line @typescript-eslint/no-redeclare -- intentional enum-style value + type pairing
export type MediaType = (typeof MediaType)[keyof typeof MediaType];
