/** Whether Instagram still accepts the stored connection. Also the wire values. */
export const InstagramConnectionStatus = {
  Active: 'active',
  Expired: 'expired',
} as const;

export type InstagramConnectionStatusType = (typeof InstagramConnectionStatus)[keyof typeof InstagramConnectionStatus];
