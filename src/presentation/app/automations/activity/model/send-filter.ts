/** The Activity screen's segments (spec §4). */
export const SendFilter = {
  All: 'all',
  Sent: 'sent',
  Failed: 'failed',
} as const;

export type SendFilterType = (typeof SendFilter)[keyof typeof SendFilter];
