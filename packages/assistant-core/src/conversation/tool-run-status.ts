/** Where a tool call the assistant made has got to. */
export const ToolRunStatus = {
  Running: 'running',
  Succeeded: 'succeeded',
  Failed: 'failed',
  /** The model withdrew the call, usually because the user spoke over it. */
  Cancelled: 'cancelled',
} as const;

export type ToolRunStatusType = (typeof ToolRunStatus)[keyof typeof ToolRunStatus];
