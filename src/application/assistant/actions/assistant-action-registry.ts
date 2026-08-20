import { AssistantAction, type AssistantActionType } from '@domain/assistant/actions/assistant-action-type';
import type { AssistantActionHandlerType } from '@domain/assistant/actions/assistant-action-handler';
import type { AssistantActionResultType } from '@domain/assistant/actions/assistant-action-result';
import { CharConstants } from '@core/constants';

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
  private readonly handlers = new Map<AssistantActionType, AssistantActionHandlerType>();
  private describeScreen: () => string = () => CharConstants.empty;

  register(action: AssistantActionType, handler: AssistantActionHandlerType): () => void {
    this.handlers.set(action, handler);
    return () => {
      // Only clear it if it is still ours: a screen unmounting after its
      // replacement registered the same action would otherwise delete the
      // live handler on its way out.
      if (this.handlers.get(action) === handler) this.handlers.delete(action);
    };
  }

  /** Supplies the one-line screen state appended to every result. */
  setScreenDescriber(describe: () => string): void {
    this.describeScreen = describe;
  }

  get registeredActions(): AssistantActionType[] {
    return [...this.handlers.keys()];
  }

  async run(action: string, arg?: string): Promise<AssistantActionResultType> {
    if (!isKnownAction(action)) {
      return this.withContext({ ok: false, error: 'unknown_action' });
    }

    const handler = this.handlers.get(action);
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
