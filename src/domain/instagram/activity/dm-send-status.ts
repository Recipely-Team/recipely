/** Where one private reply stands. Also the wire values. */
export const DmSendStatus = {
  Pending: 'pending',
  Sent: 'sent',
  Failed: 'failed',
} as const;

export type DmSendStatusType = (typeof DmSendStatus)[keyof typeof DmSendStatus];
