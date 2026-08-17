export const TabType = {
  Saved: 'saved',
  Liked: 'liked',
  Created: 'created',
  Drafts: 'drafts',
} as const;

// eslint-disable-next-line @typescript-eslint/no-redeclare -- intentional enum-style value + type pairing
export type TabType = (typeof TabType)[keyof typeof TabType];
