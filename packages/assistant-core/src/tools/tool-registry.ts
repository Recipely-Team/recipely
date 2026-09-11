import type { AssistantTool } from './assistant-tool';
import type { ToolCall } from './tool-call';
import type { ToolDefinition } from './tool-definition';
import { ToolError } from './tool-error';
import type { ToolOutcome } from './tool-outcome';

const FAILED = false;

/**
 * The tools an assistant can run, looked up by the name the model called.
 *
 * @remarks
 * - **Every call gets an answer.** An unknown name and a `run` that throws are
 *   both answered with `{ ok: false, error }`: a live session waits for a
 *   response to every call, and one left unanswered stalls the conversation
 *   with no error anywhere.
 * - **Registering is dynamic; declaring is not.** A screen can register a
 *   handler while it is mounted and remove it after, but the model only knows
 *   the tools its session was configured with (for Gemini, at token-mint time)
 *   — `definitions()` is what to hand the token server.
 * - **Unregistering removes only what it registered.** Two mounts of the same
 *   screen replace each other's handler; the first to unmount must not remove
 *   the second's.
 */
export class ToolRegistry {
  private readonly tools = new Map<string, AssistantTool>();

  constructor(tools: readonly AssistantTool[] = []) {
    for (const tool of tools) this.register(tool);
  }

  /** Adds or replaces the tool under its name; returns the function that removes it. */
  register(tool: AssistantTool): () => void {
    const name = tool.definition.name;
    this.tools.set(name, tool);
    return () => {
      if (this.tools.get(name) === tool) this.tools.delete(name);
    };
  }

  definitions(): ToolDefinition[] {
    return [...this.tools.values()].map((tool) => tool.definition);
  }

  async run(call: ToolCall): Promise<ToolOutcome> {
    const tool = this.tools.get(call.name);
    if (tool === undefined) return { ok: FAILED, response: { ok: FAILED, error: ToolError.UnknownTool } };

    try {
      const response = await tool.run(call.args, call);
      return { ok: response.ok !== FAILED, response };
    } catch (error) {
      const message = error instanceof Error ? error.message : undefined;
      return { ok: FAILED, response: { ok: FAILED, error: ToolError.Threw, ...(message ? { message } : {}) } };
    }
  }
}
