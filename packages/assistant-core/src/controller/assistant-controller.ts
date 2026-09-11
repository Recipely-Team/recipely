import { Transcript } from '../conversation/transcript';
import { ToolRunStatus } from '../conversation/tool-run-status';
import type { LevelSource } from '../levels/level-source';
import { AssistantFailureCode } from '../result/failure-code';
import type { AssistantFailure } from '../result/failure';
import { fail, ok } from '../result/result';
import type { Result } from '../result/result';
import { SessionEventKind } from '../session/session-event-kind';
import type { SessionEvent } from '../session/session-event';
import { Speaker } from '../session/speaker';
import type { SpeakerType } from '../session/speaker';
import type { ToolCall } from '../tools/tool-call';
import { ToolRegistry } from '../tools/tool-registry';
import type { AssistantControllerOptions } from './assistant-controller-options';
import type { AssistantState } from './assistant-state';
import { AssistantStatus } from './assistant-status';
import type { AssistantStatusType } from './assistant-status';
import { EchoGate } from './echo-gate';
import { EndReason } from './end-reason';
import type { EndReasonType } from './end-reason';

/**
 * Measured defaults, each paid for by a bug:
 * - `utteranceGapMs` — the API marks no boundary inside a turn, so two things
 *   said in a row merged into one message until a pause was taken as one.
 * - `answerTimeoutMs` — three questions in a row went unanswered while the UI
 *   said "listening"; a model that is answering starts audio in a second or two.
 * - `silenceTimeoutMs` — 8 s killed sessions during ordinary pauses (reading,
 *   walking to the fridge); unlimited lets a forgotten session bill all day.
 * - `echoTailMs` — the speaker rings on after the last sample.
 * - `maxHandovers` — a server re-issuing `goAway` at once would otherwise loop.
 */
const DEFAULT_TIMING = {
  utteranceGapMs: 1_200,
  answerTimeoutMs: 12_000,
  silenceTimeoutMs: 90_000 as number | null,
  echoTailMs: 250,
  maxHandovers: 3,
};

const MS_PER_SECOND = 1000;
const NONE = 0;

const INITIAL_STATE: AssistantState = {
  status: AssistantStatus.Idle,
  transcript: [],
  isMuted: false,
  error: null,
  endReason: null,
  tokensUsed: NONE,
};

/** Statuses with an acknowledged session a typed turn or a frame can reach. */
const LIVE: ReadonlySet<AssistantStatusType> = new Set([
  AssistantStatus.Listening,
  AssistantStatus.Thinking,
  AssistantStatus.Speaking,
  AssistantStatus.Working,
]);

const noop = (): void => undefined;

// Only moves forwards: the echo gate compares against a future time, and a
// wall clock corrected backwards would leave the microphone deaf for the jump.
const monotonicClock = (): number =>
  typeof performance !== 'undefined' && typeof performance.now === 'function' ? performance.now() : Date.now();

type Timer = ReturnType<typeof setTimeout>;

/** Events that are the model answering — only these end the wait for an answer. */
const MODEL_OUTPUT: ReadonlySet<string> = new Set([
  SessionEventKind.Audio,
  SessionEventKind.ToolCall,
  SessionEventKind.TurnComplete,
  SessionEventKind.Interrupted,
]);

const isModelOutput = (event: SessionEvent): boolean =>
  MODEL_OUTPUT.has(event.kind) || (event.kind === SessionEventKind.Transcript && event.speaker === Speaker.Assistant);

/**
 * Runs a live voice session, headless: the state a UI renders, the levels an
 * animation reads, and the controls — with or without the package's widget.
 *
 * @remarks
 * - **The start order is the only one that works.** Microphone ACCESS first
 *   (asked last, a failure earlier meant the user was never prompted), then the
 *   connection, then the microphone (it configures the process-wide audio
 *   session the player must be built under), the player (so a greeting has
 *   somewhere to go), the subscription (so nothing arrives unheard), and only
 *   then `connect`.
 * - **Every await is followed by an abandonment check.** `stop()` during
 *   `start()` bumps an epoch; whatever `start` opened after that is closed
 *   again instead of left running and billing under an idle UI.
 * - **Interruption is a flush.** `interrupted` drops the queued audio; anything
 *   softer lets the assistant finish the sentence the user talked over.
 * - **Tool calls run one at a time, in order, and are always answered.** "Open
 *   it and share it" is nonsense if the share races the open. A response from a
 *   session that has since been replaced is dropped, and a withdrawn call is
 *   never answered.
 * - **A `goAway` is survived.** The provider drops long sessions on a timer;
 *   the controller asks `getConnection` for a new credential with the
 *   resumption handle and continues on a new socket, microphone and player left
 *   running.
 * - **Levels are not state.** `inputLevel` (the user, silent while muted or
 *   while the echo gate holds the microphone shut) and `outputLevel` (what is
 *   being heard) are read on an animation clock; `getState()` changes only a
 *   few times a turn.
 */
export class AssistantController<Connection> {
  readonly inputLevel: LevelSource;
  readonly outputLevel: LevelSource;
  readonly tools: ToolRegistry;

  private state: AssistantState = INITIAL_STATE;
  private readonly listeners = new Set<() => void>();
  private readonly transcript = new Transcript();
  private readonly timing: typeof DEFAULT_TIMING;
  private readonly clock: () => number;
  private readonly echo: EchoGate;
  private epoch = NONE;
  private unsubscribe: (() => void) | null = null;
  private toolQueue: Promise<void> = Promise.resolve();
  private pendingTools = NONE;
  private readonly cancelledCalls = new Set<string>();
  private resumptionHandle: string | undefined;
  private expectingGoAway = false;
  private handovers = NONE;
  private gapTimer: Timer | null = null;
  private answerTimer: Timer | null = null;
  private silenceTimer: Timer | null = null;
  private speakingTimer: Timer | null = null;
  private starting: Promise<Result<void, AssistantFailure>> | null = null;
  /** The ending under way: `teardown` is what `stop()` awaits, `settled` what a new start waits for. */
  private ending: { readonly teardown: Promise<void>; readonly settled: Promise<void> } | null = null;
  private connectingSocket = false;
  private listenAfterTools = false;

  constructor(private readonly options: AssistantControllerOptions<Connection>) {
    this.timing = { ...DEFAULT_TIMING, ...options.timing };
    this.clock = options.clock ?? monotonicClock;
    this.tools = options.tools ?? new ToolRegistry();
    this.echo = new EchoGate(options.microphone, options.player, this.timing.echoTailMs, this.clock);
    this.inputLevel = { level: () => (this.isHearing() ? options.microphone.level() : NONE) };
    this.outputLevel = { level: () => options.player.level() };
  }

  readonly getState = (): AssistantState => this.state;

  readonly subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  /**
   * Opens a session. Resolves once listening, or with the failure also written to `state.error`.
   *
   * A start requested while a session is still ending waits for it: the
   * devices are shared, and the ending one must hand them back first.
   */
  async start(): Promise<Result<void, AssistantFailure>> {
    if (this.ending !== null) await this.ending.settled;
    if (this.state.status !== AssistantStatus.Idle) return ok(undefined);

    const run = this.runStart();
    this.starting = run;
    try {
      return await run;
    } finally {
      if (this.starting === run) this.starting = null;
    }
  }

  async stop(): Promise<void> {
    if (this.state.status === AssistantStatus.Idle && this.starting === null) return;
    await this.end(EndReason.Stopped);
  }

  private async runStart(): Promise<Result<void, AssistantFailure>> {
    const { microphone, player, session } = this.options;

    this.epoch += 1;
    const startedAt = this.epoch;
    const abandoned = (): boolean => this.epoch !== startedAt;
    this.resumptionHandle = undefined;
    this.expectingGoAway = false;
    this.handovers = NONE;
    this.setState({ status: AssistantStatus.Connecting, error: null, endReason: null, isMuted: false, tokensUsed: NONE });

    const access = await microphone.ensureAccess();
    if (abandoned()) return ok(undefined);
    if (!access.ok) return this.failStart(access.failure);

    const connection = await this.fetchConnection();
    if (abandoned()) return ok(undefined);
    if (!connection.ok) return this.failStart(connection.failure);

    const input = await microphone.start(session.audioFormat.inputSampleRate, (samples) => this.onFrame(samples));
    if (abandoned()) {
      await microphone.stop().catch(noop);
      return ok(undefined);
    }
    if (!input.ok) return this.failStart(input.failure);

    const output = await player.prepare(session.audioFormat.outputSampleRate);
    if (abandoned()) {
      await this.releaseDevices();
      return ok(undefined);
    }
    if (!output.ok) return this.failStart(output.failure);

    this.unsubscribe = session.subscribe((event) => this.handle(event));
    const connected = await this.connectSocket(connection.value);
    if (abandoned()) {
      this.detach();
      await this.releaseDevices();
      return ok(undefined);
    }
    if (!connected.ok) return this.failStart(connected.failure);

    this.nudgeSilence();
    this.setState({ status: AssistantStatus.Listening });
    return ok(undefined);
  }

  /** Withholds microphone frames — the model hears silence, not a flag. */
  setMuted(isMuted: boolean): void {
    if (isMuted === this.state.isMuted) return;
    // Silence the user chose is not silence to end the session over.
    if (isMuted) this.clearTimer('silenceTimer');
    this.setState({ isMuted });
    if (!isMuted && LIVE.has(this.state.status)) this.nudgeSilence();
  }

  toggleMute(): void {
    this.setMuted(!this.state.isMuted);
  }

  /**
   * Sends a typed turn over the live session. Returns false when no session is listening.
   *
   * `hidden` sends it without a transcript line or a status change — a nudge
   * the model should act on but the user did not type ("tell them their time
   * is nearly up", "the screen changed to …").
   */
  sendText(text: string, options: { readonly hidden?: boolean } = {}): boolean {
    if (text.length === NONE || !LIVE.has(this.state.status)) return false;
    if (options.hidden === true) {
      this.options.session.sendText(text);
      return true;
    }

    this.transcript.addMessage(Speaker.User, text);
    this.options.session.sendText(text);
    this.publishTranscript();
    this.enterThinking();
    return true;
  }

  clearTranscript(): void {
    this.transcript.clear();
    this.publishTranscript();
  }

  /** Stops the session and forgets every listener. */
  async dispose(): Promise<void> {
    await this.stop();
    this.listeners.clear();
  }

  private async fetchConnection(): Promise<Result<Connection, AssistantFailure>> {
    try {
      const request = this.resumptionHandle === undefined ? {} : { resumptionHandle: this.resumptionHandle };
      return ok(await this.options.getConnection(request));
    } catch (cause) {
      return fail({
        code: AssistantFailureCode.ConnectionRefused,
        cause,
        ...(cause instanceof Error ? { detail: cause.message } : {}),
      });
    }
  }

  private onFrame(samples: Float32Array<ArrayBuffer>): void {
    if (this.state.isMuted || this.echo.isClosed()) return;
    this.options.session.sendAudio(samples);
  }

  private isHearing(): boolean {
    return LIVE.has(this.state.status) && !this.state.isMuted && !this.echo.isClosed();
  }

  private handle(event: SessionEvent): void {
    if (isModelOutput(event)) {
      this.clearTimer('answerTimer');
      if (this.state.error?.code === AssistantFailureCode.NoAnswer) this.setState({ error: null });
    }

    switch (event.kind) {
      case SessionEventKind.Transcript:
        this.transcript.appendSpeech(event.speaker, event.text);
        this.restartUtteranceGap(event.speaker);
        this.nudgeSilence();
        this.publishTranscript();
        break;
      case SessionEventKind.Audio:
        this.clearTimer('speakingTimer');
        this.options.player.enqueue(event.samples);
        if (this.state.status !== AssistantStatus.Speaking) this.setState({ status: AssistantStatus.Speaking });
        this.nudgeSilence();
        break;
      case SessionEventKind.Interrupted:
        this.options.player.flush();
        this.echo.open();
        this.clearTimer('speakingTimer');
        this.transcript.closeTurn();
        this.setState({ status: AssistantStatus.Listening, transcript: this.transcript.entries });
        break;
      case SessionEventKind.TurnComplete:
        this.transcript.closeTurn();
        this.handovers = NONE;
        this.publishTranscript();
        this.listenWhenPlaybackEnds();
        this.nudgeSilence();
        break;
      case SessionEventKind.ToolCall:
        this.runTool(event.call);
        break;
      case SessionEventKind.ToolCallCancelled:
        for (const id of event.callIds) {
          this.cancelledCalls.add(id);
          this.transcript.settleTool(id, ToolRunStatus.Cancelled);
        }
        this.publishTranscript();
        break;
      case SessionEventKind.Resumption:
        this.resumptionHandle = event.handle;
        break;
      case SessionEventKind.GoAway:
        this.expectingGoAway = true;
        break;
      case SessionEventKind.Usage:
        this.setState({ tokensUsed: event.totalTokens });
        break;
      case SessionEventKind.Closed:
        // A socket refused before it was ready is `connect`'s failure to report, not a dropped session.
        if (event.expected || this.connectingSocket) break;
        if (this.expectingGoAway && this.resumptionHandle !== undefined) {
          this.expectingGoAway = false;
          void this.reconnect();
          break;
        }
        void this.end(EndReason.Failed, { code: AssistantFailureCode.ConnectionLost });
        break;
      case SessionEventKind.Ready:
        break;
      default: {
        // A new event kind must be handled here, not dropped: this stops compiling until it is.
        const unhandled: never = event;
        void unhandled;
      }
    }
  }

  private runTool(call: ToolCall): void {
    this.pendingTools += 1;
    this.transcript.addTool(call);
    this.setState({ status: AssistantStatus.Working, transcript: this.transcript.entries });
    // A long tool is the user watching, not a silent session.
    this.nudgeSilence();

    const raisedAt = this.epoch;
    this.toolQueue = this.toolQueue.then(async () => {
      if (this.epoch !== raisedAt) return;
      const outcome = this.cancelledCalls.has(call.id) ? null : await this.tools.run(call);
      // A response to a socket that has since been replaced answers a question it never asked.
      if (this.epoch !== raisedAt) return;
      this.pendingTools -= 1;
      if (outcome !== null && !this.cancelledCalls.has(call.id)) {
        this.transcript.settleTool(call.id, outcome.ok ? ToolRunStatus.Succeeded : ToolRunStatus.Failed, outcome.response);
        this.options.session.respondToTool(call, outcome.response);
        this.publishTranscript();
      }
      if (this.pendingTools > NONE) return;
      // The turn already completed while tools ran: settle on listening once its audio has played.
      if (this.listenAfterTools) this.listenWhenPlaybackEnds();
      // Straight to thinking: passing through listening flashed "listening" between the tool and the reply.
      else if (this.state.status === AssistantStatus.Working) this.awaitAnswer();
    });
  }

  /** Continues on a new socket after a `goAway`, with the resumption handle minted into a new credential. */
  private async reconnect(): Promise<void> {
    this.epoch += 1;
    this.handovers += 1;
    // The queue is kept, not replaced: a call still running for the old socket
    // must finish before the new socket's first one starts. Its answer is
    // dropped by the epoch check.
    this.pendingTools = NONE;
    this.cancelledCalls.clear();
    if (this.handovers > this.timing.maxHandovers) {
      await this.end(EndReason.Failed, { code: AssistantFailureCode.ConnectionLost });
      return;
    }

    const startedAt = this.epoch;
    const connection = await this.fetchConnection();
    if (this.epoch !== startedAt) return;
    if (!connection.ok) {
      await this.end(EndReason.Failed, connection.failure);
      return;
    }

    const connected = await this.connectSocket(connection.value);
    if (this.epoch !== startedAt) {
      this.options.session.close();
      return;
    }
    if (!connected.ok) {
      await this.end(EndReason.Failed, connected.failure);
      return;
    }
    this.setState({ status: AssistantStatus.Listening });
  }

  private async connectSocket(connection: Connection): Promise<Result<void, AssistantFailure>> {
    this.connectingSocket = true;
    try {
      return await this.options.session.connect(connection);
    } finally {
      this.connectingSocket = false;
    }
  }

  /** Inside `runStart` only: `end()` would wait for the very start that is failing. */
  private async failStart(failure: AssistantFailure): Promise<Result<void, AssistantFailure>> {
    await this.teardown(EndReason.Failed, failure);
    return fail(failure);
  }

  /**
   * Ends the session, one ending at a time.
   *
   * `idle` is published immediately and `stop()` resolves once the teardown
   * has run, so End never waits on a connect. A start still in flight is
   * abandoned (the epoch) and releases what it opened; a new `start()` waits
   * until it has — so the abandoned start can never close devices a new
   * session already owns. A second caller joins the ending under way instead
   * of overwriting its reason.
   */
  private end(reason: EndReasonType, error: AssistantFailure | null = null): Promise<void> {
    if (this.ending !== null) return this.ending.teardown;

    const pending = this.starting;
    // Idle is published at once and the socket closed (which also unblocks a pending connect).
    const teardown =
      this.state.status !== AssistantStatus.Idle || pending !== null ? this.teardown(reason, error) : Promise.resolve();
    const settled = (async (): Promise<void> => {
      await teardown;
      if (pending === null) return;
      // The abandoned start releases what it opened after the teardown; hand the devices back once more after it.
      await pending.catch(noop);
      await this.releaseDevices();
    })();
    const entry = { teardown, settled };
    this.ending = entry;
    void settled.finally(() => {
      if (this.ending === entry) this.ending = null;
    });
    return teardown;
  }

  /**
   * Stops everything and says so at once. Output before input: stopping the
   * microphone hands the audio session back, and an output still open under
   * it can crash natively.
   */
  private async teardown(reason: EndReasonType, error: AssistantFailure | null = null): Promise<void> {
    this.epoch += 1;
    this.clearTimer('gapTimer');
    this.clearTimer('answerTimer');
    this.clearTimer('silenceTimer');
    this.clearTimer('speakingTimer');
    this.resetTools();
    this.listenAfterTools = false;
    this.detach();
    this.echo.open();
    this.transcript.closeTurn();
    this.setState({
      status: AssistantStatus.Idle,
      isMuted: false,
      endReason: reason,
      error,
      transcript: this.transcript.entries,
    });
    await this.releaseDevices();
  }

  private detach(): void {
    this.unsubscribe?.();
    this.unsubscribe = null;
    this.options.session.close();
  }

  private async releaseDevices(): Promise<void> {
    // Each alone: this path must always finish, and iOS answers a busy session with a rejection.
    await this.options.player.stop().catch(noop);
    await this.options.microphone.stop().catch(noop);
  }

  private resetTools(): void {
    this.toolQueue = Promise.resolve();
    this.pendingTools = NONE;
    this.cancelledCalls.clear();
  }

  private restartUtteranceGap(speaker: SpeakerType): void {
    this.clearTimer('gapTimer');
    this.gapTimer = setTimeout(() => {
      this.transcript.closeTurn();
      this.publishTranscript();
      // The pause that ends the user's utterance is the moment the turn becomes the model's —
      // and a user who went on talking after a pause restarts the wait for the answer.
      if (speaker === Speaker.User && (this.state.status === AssistantStatus.Listening || this.state.status === AssistantStatus.Thinking)) {
        this.awaitAnswer();
      }
    }, this.timing.utteranceGapMs);
  }

  /** Only from `listening`: audio or a tool call inside the gap means the model has already begun. */
  private enterThinking(): void {
    if (this.state.status === AssistantStatus.Listening) this.awaitAnswer();
  }

  private awaitAnswer(): void {
    this.setState({ status: AssistantStatus.Thinking });
    this.clearTimer('answerTimer');
    this.answerTimer = setTimeout(() => {
      if (this.state.status !== AssistantStatus.Thinking) return;
      this.setState({ status: AssistantStatus.Listening, error: { code: AssistantFailureCode.NoAnswer } });
    }, this.timing.answerTimeoutMs);
  }

  /** `turnComplete` arrives when the reply is SENT; it is still playing, so `speaking` lasts until it is heard. */
  private listenWhenPlaybackEnds(): void {
    if (this.pendingTools > NONE) {
      this.listenAfterTools = true;
      return;
    }
    this.listenAfterTools = false;
    const remainingMs = this.options.player.remainingSeconds() * MS_PER_SECOND;
    const listen = (): void => {
      if (this.state.status === AssistantStatus.Speaking || this.state.status === AssistantStatus.Thinking) {
        this.setState({ status: AssistantStatus.Listening });
      }
    };
    this.clearTimer('speakingTimer');
    if (remainingMs <= NONE) listen();
    else this.speakingTimer = setTimeout(listen, remainingMs);
  }

  private nudgeSilence(): void {
    this.clearTimer('silenceTimer');
    const timeout = this.timing.silenceTimeoutMs;
    if (timeout === null || this.state.isMuted) return;
    this.silenceTimer = setTimeout(() => void this.end(EndReason.Silence), timeout);
  }

  private clearTimer(name: 'gapTimer' | 'answerTimer' | 'silenceTimer' | 'speakingTimer'): void {
    const timer = this[name];
    if (timer !== null) clearTimeout(timer);
    this[name] = null;
  }

  private publishTranscript(): void {
    if (this.state.transcript !== this.transcript.entries) this.setState({ transcript: this.transcript.entries });
  }

  private setState(patch: Partial<AssistantState>): void {
    this.state = { ...this.state, ...patch };
    for (const listener of this.listeners) {
      try {
        listener();
      } catch {
        // One subscriber's failure must not stall the session or the other subscribers.
      }
    }
  }
}
