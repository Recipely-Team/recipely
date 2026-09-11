/** What running one tool call produced: the response to send, and whether it succeeded. */
export interface ToolOutcome {
  readonly ok: boolean;
  readonly response: Readonly<Record<string, unknown>>;
}
