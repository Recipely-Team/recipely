/** Which notifications the list shows. */
export const NotificationFilter = {
  All: 'all',
  Unread: 'unread',
} as const;

// eslint-disable-next-line @typescript-eslint/no-redeclare -- intentional enum-style value + type pairing
export type NotificationFilter = (typeof NotificationFilter)[keyof typeof NotificationFilter];
