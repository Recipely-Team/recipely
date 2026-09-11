import type { AssistantTool } from '@live-assistant/core';
import { ApiLiveTool } from '@infrastructure/constants/api/api-live-tool';
import type { AssistantActionRegistry } from '@application/assistant/actions/assistant-action-registry';
import { CharConstants } from '@core/constants';
import { isNonEmptyString, isString } from '@core/guards/type-guards';

/**
 * The handler for the backend's single `runAction` tool.
 *
 * @remarks
 * - **One tool, many actions.** The backend declares `runAction` with an
 *   `action` word and an optional `arg` (the model's words, untranslated); the
 *   registry is what knows how to perform a word, so this only unpacks the
 *   call and hands it over.
 * - **The registry's result IS the answer.** It already answers every word —
 *   an unknown one with `unavailable_here`, a handler that threw with `failed`
 *   — so the model always hears back and can say what happened.
 * - **`action` is a bare string on purpose.** It is a word a model chose;
 *   narrowing it here would mean deciding what to do about an unrecognised one
 *   in two places, and only the registry can answer it.
 */
export function createRunActionTool(registry: AssistantActionRegistry): AssistantTool {
  return {
    definition: { name: ApiLiveTool.name, description: ApiLiveTool.description },
    run: async (args) => {
      const action = args[ApiLiveTool.actionField];
      const arg = args[ApiLiveTool.argField];
      const result = await registry.run(
        isString(action) ? action : CharConstants.empty,
        isNonEmptyString(arg) ? arg : undefined,
      );
      return { ...result };
    },
  };
}
