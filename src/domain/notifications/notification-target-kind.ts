/** What a notification points at, and therefore which route opens on tap. */
export const NotificationTargetKind = {
  Recipe: 'recipe',
  Comment: 'comment',
  /** A background import finished; tapping opens the draft it produced. */
  Draft: 'draft',
} as const;

// eslint-disable-next-line @typescript-eslint/no-redeclare -- intentional enum-style value + type pairing
export type NotificationTargetKind =
  (typeof NotificationTargetKind)[keyof typeof NotificationTargetKind];
