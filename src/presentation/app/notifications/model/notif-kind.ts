export const NotifKind = {
  Comment: 'comment',
  Like: 'like',
  Favorite: 'favorite',
  AiDone: 'ai_done',
  /** A queued Instagram import finished; the row opens the draft it produced. */
  ImportDone: 'import_done',
  /** A queued import that produced nothing — the server sends it as `import_done` with no draft and no recipe. */
  ImportFailed: 'import_failed',
  ModerationApproved: 'moderation_approved',
  ModerationPending: 'moderation_pending',
  Follow: 'follow',
  Generic: 'generic',
} as const;

// eslint-disable-next-line @typescript-eslint/no-redeclare -- intentional enum-style value + type pairing
export type NotifKind = (typeof NotifKind)[keyof typeof NotifKind];
