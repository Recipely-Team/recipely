import { AssistantAction, type AssistantActionType } from '@domain/assistant/actions/assistant-action-type';
import type { AssistantActionHandlerType } from '@domain/assistant/actions/assistant-action-handler';
import type { AssistantActionResultType } from '@domain/assistant/actions/assistant-action-result';
import { CharConstants, ValueConstants } from '@core/constants';

/**
 * Routes a tool call from the model to the code that performs it.
 *
 * @remarks
 * - **It always answers.** A live session stops and waits for a response to
 *   every function call it makes, so an unknown action, a missing handler or a
 *   handler that threw all have to come back as a result — otherwise the
 *   assistant goes silent mid-sentence and nothing anywhere reports why. An
 *   unknown action is a normal outcome, not a bug: the enum the model chooses
 *   from is declared by the backend, so a deploy there can teach it a word this
 *   build has never heard.
 * - **A key holds a STACK, not one handler.** Several actions are implemented
 *   by more than one screen — the pill answers `openRecipe` from anywhere, My
 *   Recipes answers it from the list in front of the user — and the innermost
 *   screen should win while it is open, then hand the action back when it
 *   leaves. A single slot could not hand anything back.
 * - **Handlers register themselves.** Half of these are UI gestures — navigate,
 *   focus a field, open the photo picker — which only the presentation layer
 *   can perform, and half are use cases. Both arrive through `register`, so
 *   this class knows about neither.
 * - **A screen-context provider, not a screen-context field.** The context
 *   travels inside every result, and it has to be read at the moment the result
 *   is built: the assistant navigates while it works, so a value captured when
 *   the handler was registered would describe the screen the user has left.
 */
export class AssistantActionRegistry {
  private readonly handlers = new Map<AssistantActionType, AssistantActionHandlerType[]>();
  private describeScreen: () => string = () => CharConstants.empty;

  register(action: AssistantActionType, handler: AssistantActionHandlerType): () => void {
    const stack = this.handlers.get(action) ?? [];
    stack.push(handler);
    this.handlers.set(action, stack);

    return () => {
      const current = this.handlers.get(action);
      if (current === undefined) return;

      // Remove THIS handler wherever it sits, rather than clearing the key.
      // Five actions are implemented by two screens each — the always-mounted
      // pill answers `openRecipe`, and My Recipes answers it better while it
      // is open — and expo-router leaves the screen underneath mounted. A
      // cleanup that deleted the key took the shadowed handler with it, and
      // nothing re-registered it: `useAssistantAction`'s effect depends only
      // on the action and the registry, neither of which changes. Opening My
      // Recipes once and going back left "open the lentil soup" answering
      // `unavailable_here` for the rest of the process.
      const at = current.lastIndexOf(handler);
      if (at !== ValueConstants.minusOne) current.splice(at, ValueConstants.one);
      if (current.length === ValueConstants.zero) this.handlers.delete(action);
    };
  }

  /** Supplies the one-line screen state appended to every result. */
  setScreenDescriber(describe: () => string): void {
    this.describeScreen = describe;
  }

  get registeredActions(): AssistantActionType[] {
    return [...this.handlers.keys()];
  }

  /** The handler that answers now: the most recently registered one. */
  private topmost(action: AssistantActionType): AssistantActionHandlerType | undefined {
    return this.handlers.get(action)?.at(ValueConstants.minusOne);
  }

  async run(action: string, arg?: string): Promise<AssistantActionResultType> {
    if (!isKnownAction(action)) {
      return this.withContext({ ok: false, error: 'unknown_action' });
    }

    const handler = this.topmost(action);
    if (handler === undefined) {
      // The action exists but nothing on this screen can do it — "open the
      // photo picker" with no draft open. The model can recover from being
      // told so; it cannot recover from silence.
      return this.withContext({ ok: false, error: 'unavailable_here' });
    }

    try {
      return this.withContext(await handler(arg));
    } catch {
      // A handler that throws is a bug, and it must still not hang the session.
      return this.withContext({ ok: false, error: 'failed' });
    }
  }

  private withContext(result: AssistantActionResultType): AssistantActionResultType {
    const ctx = this.describeScreen();
    return ctx === CharConstants.empty ? result : { ...result, ctx };
  }
}

function isKnownAction(action: string): action is AssistantActionType {
  return (Object.values(AssistantAction) as string[]).includes(action);
}
