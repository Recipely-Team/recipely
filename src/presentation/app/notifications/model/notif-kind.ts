export const NotifKind = {
  Comment: 'comment',
  Like: 'like',
  Favorite: 'favorite',
  AiDone: 'ai_done',
  ModerationApproved: 'moderation_approved',
  ModerationPending: 'moderation_pending',
  Follow: 'follow',
  Generic: 'generic',
} as const;

// eslint-disable-next-line @typescript-eslint/no-redeclare -- intentional enum-style value + type pairing
export type NotifKind = (typeof NotifKind)[keyof typeof NotifKind];
