import type { ToolCall } from './tool-call';
import type { ToolDefinition } from './tool-definition';

/**
 * A function the model may call, and the code that runs it.
 *
 * @remarks
 * - **Whatever `run` returns is the model's answer.** Keep it small and
 *   factual (`{ ok: true, opened: 'Settings' }`); the model reads it and
 *   decides what to say.
 * - **Return `{ ok: false, … }` to report a failure** — to the model, which can
 *   then say so, and to the transcript, which marks the call failed. A `run`
 *   that throws is reported the same way, so a bug in one tool never stalls
 *   the conversation.
 * - **`args` is unvalidated.** It is the model's guess at `definition.parameters`.
 */
export interface AssistantTool {
  readonly definition: ToolDefinition;
  run(
    args: Readonly<Record<string, unknown>>,
    call: ToolCall,
  ): Promise<Readonly<Record<string, unknown>>> | Readonly<Record<string, unknown>>;
}
