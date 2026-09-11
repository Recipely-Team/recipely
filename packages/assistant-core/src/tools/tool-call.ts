/**
 * One function call the model made.
 *
 * `args` is whatever the model produced, unvalidated: it is a model's guess at
 * the declared parameters, so the code that runs the tool checks it. Answer
 * every call with `respondToTool`, even one you cannot run — a live session
 * waits for the answer and the conversation stalls without one.
 */
export interface ToolCall {
  readonly id: string;
  readonly name: string;
  readonly args: Readonly<Record<string, unknown>>;
}
