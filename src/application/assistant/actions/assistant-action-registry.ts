import type { AssistantActionType } from '@domain/assistant/actions/assistant-action-type';
import type { AssistantActionHandlerType } from '@domain/assistant/actions/assistant-action-handler';
import type { AssistantActionResultType } from '@domain/assistant/actions/assistant-action-result';
import { CharConstants, ValueConstants } from '@core/constants';
import { isAssistantAction } from '@domain/assistant/actions/is-assistant-action';

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
 * - **A handler may decline.** Answering `notMine` passes the call outward to
 *   the handler underneath instead of failing — the list screen answers for
 *   the rows it is showing, and anything else falls through to the one that
 *   works from anywhere.
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
  /**
   * Handlers of last resort, kept OUT of the stack.
   *
   * A fallback registered into the stack was only outermost by accident of
   * React's effect order — children flush before parents, so a screen mounting
   * in the same commit as the root registered FIRST and the fallback ended up
   * innermost, answering for a screen the user was already on. A separate tier
   * makes "after everything else" true by construction rather than by the
   * order of two lines in a layout file.
   */
  private readonly fallbacks = new Map<AssistantActionType, AssistantActionHandlerType>();
  /** Woken whenever a handler registers, so a caller can wait for a screen to arrive. */
  private readonly watchers = new Set<() => void>();
  private describeScreen: () => string = () => CharConstants.empty;

  register(action: AssistantActionType, handler: AssistantActionHandlerType): () => void {
    const stack = this.handlers.get(action) ?? [];
    stack.push(handler);
    this.handlers.set(action, stack);
    for (const wake of this.watchers) wake();

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

  /**
   * Registers the handler to try when no screen answered.
   *
   * One per action: it belongs to the root, which is mounted once.
   */
  registerFallback(action: AssistantActionType, handler: AssistantActionHandlerType): () => void {
    this.fallbacks.set(action, handler);
    return () => {
      if (this.fallbacks.get(action) === handler) this.fallbacks.delete(action);
    };
  }

  /** Whether some screen — not the fallback — answers `action` right now. */
  hasScreenHandler(action: AssistantActionType): boolean {
    return (this.handlers.get(action) ?? []).length > ValueConstants.zero;
  }

  /**
   * Waits for a screen that answers `action` to finish mounting.
   *
   * Navigation is not instant and a screen registers its handlers on mount, so
   * a fallback that pushed a route and immediately looked would always find
   * nothing. Resolves false if nothing arrives in time — a route that does not
   * exist, or a guard that sent the user somewhere else.
   */
  async waitForScreenHandler(action: AssistantActionType, timeoutMs: number): Promise<boolean> {
    if (this.hasScreenHandler(action)) return true;

    return new Promise<boolean>((resolve) => {
      const settle = (arrived: boolean): void => {
        clearTimeout(timer);
        this.watchers.delete(check);
        resolve(arrived);
      };
      const check = (): void => {
        if (this.hasScreenHandler(action)) settle(true);
      };
      const timer = setTimeout(() => settle(false), timeoutMs);
      this.watchers.add(check);
    });
  }

  /** Supplies the one-line screen state appended to every result. */
  setScreenDescriber(describe: () => string): void {
    this.describeScreen = describe;
  }

  /** The one-line screen state, for a caller that needs it outside a result. */
  get screenContext(): string {
    return this.describeScreen();
  }

  get registeredActions(): AssistantActionType[] {
    return [...this.handlers.keys()];
  }

  async run(action: string, arg?: string): Promise<AssistantActionResultType> {
    if (!isAssistantAction(action)) {
      return this.withContext({ ok: false, error: 'unknown_action' });
    }

    const stack = this.handlers.get(action) ?? [];
    for (let at = stack.length - ValueConstants.one; at >= ValueConstants.zero; at -= ValueConstants.one) {
      try {
        const result = await stack[at]!(arg);
        if (result.notMine !== true) return this.withContext(result);
      } catch {
        return this.withContext({ ok: false, error: 'failed' });
      }
    }

    // Only now. The fallback carries an action to the screen that owns it, so
    // it must never answer for a screen that is already open — including one
    // that said `notMine`, which means "not this one", not "not here".
    const fallback = this.fallbacks.get(action);
    if (fallback !== undefined) {
      try {
        return this.withContext(await fallback(arg));
      } catch {
        return this.withContext({ ok: false, error: 'failed' });
      }
    }

    if (stack.length === ValueConstants.zero) {
      return this.withContext({ ok: false, error: 'unavailable_here' });
    }
    return this.withContext({ ok: false, error: 'not_found' });
  }

  private withContext(result: AssistantActionResultType): AssistantActionResultType {
    // A handler that said something more specific keeps it. My Recipes reports
    // which tab it refreshed; overwriting that with the pathname threw away
    // the one thing that handler bothered to say.
    if (result.ctx !== undefined) return result;

    const ctx = this.describeScreen();
    return ctx === CharConstants.empty ? result : { ...result, ctx };
  }
}
