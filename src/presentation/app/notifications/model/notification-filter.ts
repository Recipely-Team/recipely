/** Which notifications the list shows. */
export const NotificationFilter = {
  All: 'all',
  Unread: 'unread',
} as const;

export type NotificationFilterType = (typeof NotificationFilter)[keyof typeof NotificationFilter];
