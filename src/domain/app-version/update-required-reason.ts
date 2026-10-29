/** Why an update is required: below the supported minimum, or one release an admin pulled. */
export const UpdateRequiredReason = {
  Unsupported: 'unsupported',
  Blocked: 'blocked',
} as const;

export type UpdateRequiredReasonType = (typeof UpdateRequiredReason)[keyof typeof UpdateRequiredReason];
