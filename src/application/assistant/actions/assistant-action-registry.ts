import type { AssistantActionType } from '@domain/assistant/actions/assistant-action-type';
import type { AssistantActionHandlerType } from '@domain/assistant/actions/assistant-action-handler';
import type { AssistantActionResultType } from '@domain/assistant/actions/assistant-action-result';
import { CharConstants, ValueConstants } from '@core/constants';
import { isAssistantAction } from '@domain/assistant/actions/is-assistant-action';
import { AssistantActionError } from '@domain/assistant/actions/assistant-action-error';

/** Between the route and what is on it — "screen=/recipes; recipes=1) Baklava". */
const SCREEN_LINE_SEPARATOR = '; ';

/** What a remembered failure says when the handler did not name a reason. */
const UNNAMED_ERROR = 'failed';

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
 * - **The screen line says WHERE and WHAT.** A path alone told the model the
 *   user was on `/recipes` and nothing else, so "open the second one" and "save
 *   the chicken one" could only ever be guesses handed to a handler to resolve
 *   — and "is there anything here?" had no answer at all. Screens that are
 *   showing something register a describer of their own; the innermost one
 *   wins, exactly as handlers do, so a recipe pushed over the feed describes
 *   itself and hands the feed back on the way out.
 * - **Reading a screen is a second, longer describer.** The line is charged on
 *   every turn, so it counts rather than quotes; a reading is charged only when
 *   the user asks for one out loud, so it may be the whole page. Keeping them
 *   apart is what lets "read me this draft" answer with the draft without
 *   putting the draft into every tool result for the rest of the session.
 * - **It remembers the last failure.** By the time a user says "report this",
 *   the result that said what broke is turns behind them in a window that
 *   compresses — so the report would have carried the user's paraphrase and
 *   nothing else.
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
  /**
   * What each mounted screen is showing, innermost last.
   *
   * A stack rather than a slot, for the reason handlers are: expo-router leaves
   * the screen underneath mounted, so a single slot would be cleared by the
   * detail screen leaving and the feed would go on describing nothing.
   */
  private readonly contentDescribers: (() => string)[] = [];
  /**
   * What each mounted screen would say if asked to read itself out, innermost
   * last.
   *
   * A SECOND stack beside {@link contentDescribers}, not the same one, because
   * the two are paid for differently: the screen line rides inside every tool
   * result and is charged on every turn, so it stays a handful of counts, while
   * a reading is the whole of what is on screen and is charged only when the
   * user asks for it out loud. Folding them together would either put a recipe
   * into every result or leave "read me this page" with nothing to read.
   */
  private readonly readingDescribers: (() => string)[] = [];
  /**
   * The last action that failed, kept for the problem report.
   *
   * The assistant is asked to report a failure AFTER it has explained it, by
   * which time the result that carried the reason is several turns back in a
   * context window that compresses. Remembering one line here is what lets
   * `reportProblem` send what actually went wrong instead of the user's
   * paraphrase of it.
   */
  private lastFailedAction: string | null = null;

  register(action: AssistantActionType, handler: AssistantActionHandlerType): () => void {
    const stack = this.handlers.get(action) ?? [];
    stack.push(handler);
    this.handlers.set(action, stack);
    for (const wake of this.watchers) wake();

    return () => {
      const current = this.handlers.get(action);
      if (current === undefined) return;

      // Remove this handler wherever it sits: two screens can share a key and both stay mounted.
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

  /** Supplies the route half of the screen line appended to every result. */
  setScreenDescriber(describe: () => string): void {
    this.describeScreen = describe;
  }

  /**
   * Registers what the calling screen is showing, for the screen line.
   *
   * Called at read time, so a describer may close over live state; the screen
   * does not have to re-register when its list changes.
   */
  registerScreenContent(describe: () => string): () => void {
    this.contentDescribers.push(describe);
    return () => {
      const at = this.contentDescribers.lastIndexOf(describe);
      if (at !== ValueConstants.minusOne) {
        this.contentDescribers.splice(at, ValueConstants.one);
      }
    };
  }

  /**
   * Registers the long-form reading of the calling screen.
   *
   * Optional: a screen with nothing to read — a form, a wait screen — simply
   * does not register, and `readScreen` falls back to the screen line, which
   * at least names the route.
   */
  registerScreenReading(read: () => string): () => void {
    this.readingDescribers.push(read);
    return () => {
      const at = this.readingDescribers.lastIndexOf(read);
      if (at !== ValueConstants.minusOne) {
        this.readingDescribers.splice(at, ValueConstants.one);
      }
    };
  }

  /** Everything the innermost screen is showing, for `readScreen` to say aloud. */
  get screenReading(): string {
    const last = this.readingDescribers[this.readingDescribers.length - ValueConstants.one];
    const reading = last === undefined ? CharConstants.empty : this.describe(last);
    return reading === CharConstants.empty ? this.screenContext : reading;
  }

  /** The last failure this session produced, or null if nothing has failed. */
  get lastFailure(): string | null {
    return this.lastFailedAction;
  }

  /** The one-line screen state, for a caller that needs it outside a result. */
  get screenContext(): string {
    // A throwing describer must not take the tool response with it.
    const route = this.describe(() => this.describeScreen());
    const last = this.contentDescribers[this.contentDescribers.length - ValueConstants.one];
    const content = last === undefined ? CharConstants.empty : this.describe(last);
    return [route, content]
      .filter((part) => part !== CharConstants.empty)
      .join(SCREEN_LINE_SEPARATOR);
  }

  private describe(from: () => string): string {
    try {
      return from();
    } catch {
      return CharConstants.empty;
    }
  }

  get registeredActions(): AssistantActionType[] {
    return [...this.handlers.keys()];
  }

  async run(action: string, arg?: string): Promise<AssistantActionResultType> {
    if (!isAssistantAction(action)) {
      return this.withContext({ ok: false, error: AssistantActionError.UnknownAction });
    }

    const stack = this.handlers.get(action) ?? [];
    for (let at = stack.length - ValueConstants.one; at >= ValueConstants.zero; at -= ValueConstants.one) {
      try {
        const result = await stack[at]!(arg);
        if (result.notMine !== true) return this.withContext(result);
      } catch {
        return this.withContext({ ok: false, error: AssistantActionError.Failed });
      }
    }

    // Fallback only once the stack is exhausted (notMine = not this one).
    const fallback = this.fallbacks.get(action);
    if (fallback !== undefined) {
      try {
        return this.withContext(await fallback(arg));
      } catch {
        return this.withContext({ ok: false, error: AssistantActionError.Failed });
      }
    }

    if (stack.length === ValueConstants.zero) {
      return this.withContext({ ok: false, error: AssistantActionError.UnavailableHere });
    }
    return this.withContext({ ok: false, error: AssistantActionError.NotFound });
  }

  private withContext(result: AssistantActionResultType): AssistantActionResultType {
    if (!result.ok) {
      this.lastFailedAction = [
        `error=${result.error ?? UNNAMED_ERROR}`,
        this.screenContext,
      ]
        .filter((part) => part !== CharConstants.empty)
        .join(SCREEN_LINE_SEPARATOR);
    }

    // A handler's own ctx wins.
    if (result.ctx !== undefined) return result;

    const ctx = this.screenContext;
    return ctx === CharConstants.empty ? result : { ...result, ctx };
  }
}
