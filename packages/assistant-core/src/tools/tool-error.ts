/** The `error` a tool response carries when the registry, not the tool, answered. */
export const ToolError = {
  /** The model called a name nothing is registered under. */
  UnknownTool: 'unknown_tool',
  /** The tool's `run` threw. */
  Threw: 'tool_failed',
} as const;

export type ToolErrorType = (typeof ToolError)[keyof typeof ToolError];
