import { create } from 'zustand';
import {
  AssistantController,
  AssistantFailureCode,
  AssistantStatus as SessionStatus,
  EndReason,
  ToolRegistry,
} from '@live-assistant/core';
import type {
  AssistantFailure,
  AssistantMicrophone,
  AssistantPlayer,
  AssistantSession,
  TranscriptEntry,
} from '@live-assistant/core';
import { AssistantLevelMeter } from '@application/assistant/session/assistant-level-meter';
import { assistantIsLive } from '@application/assistant/session/assistant-is-live';
import { createRunActionTool } from '@application/assistant/session/assistant-live-tool';
import { AssistantStatus } from '@application/assistant/session/assistant-status';
import type { AssistantStatusType } from '@application/assistant/session/assistant-status';
import { actionDetail, toTranscriptLines } from '@application/assistant/session/assistant-transcript-lines';
import { AssistantTranscriptLineKind } from '@application/assistant/session/assistant-transcript-line-kind';
import { AssistantView } from '@application/assistant/session/assistant-view';
import { toAppFailure } from '@application/assistant/session/to-app-failure';
import type { AssistantActionRegistry } from '@application/assistant/actions/assistant-action-registry';
import type { AssistantSessionStoreState } from '@application/assistant/session/assistant-session-store-state';
import type { AssistantTranscriptLine } from '@application/assistant/session/assistant-transcript-line';
import type { BoundStore } from '@application/store/bound-store';
import { AssistantAction } from '@domain/assistant/actions/assistant-action-type';
import type { AssistantActionType } from '@domain/assistant/actions/assistant-action-type';
import { isAssistantAction } from '@domain/assistant/actions/is-assistant-action';
import { AssistantDenialReason } from '@domain/assistant/session/assistant-denial-reason';
import type { AssistantDenialReasonType } from '@domain/assistant/session/assistant-denial-reason';
import { AssistantGrantStatus } from '@domain/assistant/session/assistant-grant-status';
import type { AssistantMessengerInterface } from '@domain/assistant/session/assistant-messenger-interface';
import type { AssistantTokenRepositoryInterface } from '@domain/assistant/session/assistant-token-repository-interface';
import type { LiveSessionCredentials } from '@domain/assistant/session/live-session-credentials';
import { ChatRole } from '@domain/drafts/chat-role';
import { CharConstants, ValueConstants } from '@core/constants';
import { DiagnosticMessage } from '@core/failure/diagnostic-message';
import { Failure } from '@core/failure/failure';
import { UnknownFailure } from '@core/failure/kinds/unknown-failure';

interface AssistantSessionStoreDeps {
  session: AssistantSession<LiveSessionCredentials>;
  microphone: AssistantMicrophone;
  player: AssistantPlayer;
  tokens: AssistantTokenRepositoryInterface;
  messenger: AssistantMessengerInterface;
  registry: AssistantActionRegistry;
}

/** A line the app adds itself; its id is given when it is placed. */
type NewLine =
  | { readonly kind: typeof AssistantTranscriptLineKind.Speech; readonly speaker: ChatRole; readonly text: string }
  | { readonly kind: typeof AssistantTranscriptLineKind.Action; readonly action: AssistantActionType; readonly detail?: string };

/** A Denied grant, thrown out of `getConnection` so it comes back as the failure's `cause`. */
class GrantRefusal {
  constructor(
    readonly reason: AssistantDenialReasonType,
    readonly remainingSeconds: number,
  ) {}
}

const HEARTBEAT_INTERVAL_MS = 15_000;
const HEARTBEAT_SECONDS = 15;
/**
 * How much budget is left when the assistant says out loud that it is running
 * out. One heartbeat of slack past a round minute, so a tick cannot straddle
 * the threshold and skip it — the session used to end mid-sentence with only a
 * caption to explain it ("asistan bir anda kesildi").
 */
const BUDGET_WARNING_SECONDS = 60 + HEARTBEAT_SECONDS;
/**
 * What the model is told when the budget is nearly gone: an instruction, not a
 * sentence to repeat — the session knows which language it is speaking.
 */
const BUDGET_WARNING_PROMPT =
  'SYSTEM: about one minute of voice time remains today. Tell the user briefly, ' +
  'in the language you are speaking, that you are almost out of time and they ' +
  'can keep going by typing. Say nothing else and call no action.';
const EXTRA_ID_PREFIX = 'app-';

/**
 * Recipely's voice assistant: `@live-assistant/core`'s controller, plus what
 * only this app has.
 *
 * @remarks
 * - **The session itself is the library's.** Start order, abandonment, mute,
 *   the echo gate, interruption, the transcript, serialised tool calls,
 *   `goAway` handovers, the silence timeout and the wait for an answer all
 *   live in `AssistantController`, tested there against fakes and the live API.
 *   This store keeps the shape the screens were written against and adds
 *   Recipely's own concerns.
 * - **The budget.** The server cannot see a socket it is not part of, so a
 *   heartbeat reports seconds while live; a metered account at zero ends the
 *   session as `Unavailable`, and one minute before that the model is told —
 *   hidden from the transcript — to say so in the user's language. Minting
 *   goes through the backend, so every handover re-checks the budget too.
 * - **Refusals are reasons, not errors.** Out of budget, or the microphone
 *   refused, the pill says why and the text mode is the way through; neither
 *   is a request that failed.
 * - **Typing without a session goes over HTTP** and answers in the same
 *   transcript, anchored where it happened; with a live session the turn goes
 *   on the socket, where it carries the conversation's context.
 * - **The waveform level.** Published from the frames that actually go to the
 *   socket and the audio actually queued, through `AssistantLevelMeter`'s
 *   screen-rate throttle — so mute and the echo gate silence it exactly as
 *   they silence the model. It becomes `useLevelFrames` when the screens move
 *   to the library's hooks.
 * - **Status.** The controller's, except while no session runs: then the app's
 *   own `Unavailable` (a refusal) or `Working` (a typed turn over HTTP).
 */
export const configureAssistantSessionStore = (
  deps: AssistantSessionStoreDeps,
): BoundStore<AssistantSessionStoreState> => {
  const { tokens, messenger, registry } = deps;
  const meter = new AssistantLevelMeter();
  let languageCode = CharConstants.empty;
  let overlay: AssistantStatusType | null = null;
  let extras: { after: number; line: AssistantTranscriptLine }[] = [];
  let extraId = ValueConstants.zero;
  let typedEpoch = ValueConstants.zero;
  let typedQueue: Promise<void> = Promise.resolve();
  let heartbeat: ReturnType<typeof setInterval> | null = null;
  let heartbeatEpoch = ValueConstants.zero;
  let seenError: AssistantFailure | null = null;
  let seenEntries: readonly TranscriptEntry[] | null = null;
  let previousStatus: string = SessionStatus.Idle;

  return create<AssistantSessionStoreState>((set, get) => {
    let controller!: AssistantController<LiveSessionCredentials>;

    const publishLevel = (samples: Float32Array<ArrayBuffer>): void => {
      const level = meter.measure(samples);
      if (level !== null) set({ level });
    };

    // Frames reach `sendAudio` only after the controller's mute and echo gate,
    // so the waveform follows what the model actually hears.
    const session: AssistantSession<LiveSessionCredentials> = {
      audioFormat: deps.session.audioFormat,
      connect: (credentials) => deps.session.connect(credentials),
      sendAudio: (samples) => {
        deps.session.sendAudio(samples);
        // A frame captured while the session was being torn down would
        // otherwise leave the waveform standing at its last height.
        const { status } = controller.getState();
        if (status !== SessionStatus.Idle && status !== SessionStatus.Speaking) publishLevel(samples);
      },
      sendText: (text) => deps.session.sendText(text),
      respondToTool: (call, response) => deps.session.respondToTool(call, response),
      subscribe: (listener) => deps.session.subscribe(listener),
      close: () => deps.session.close(),
    };
    const player: AssistantPlayer = {
      level: () => deps.player.level(),
      remainingSeconds: () => deps.player.remainingSeconds(),
      prepare: (sampleRate) => deps.player.prepare(sampleRate),
      enqueue: (samples) => {
        deps.player.enqueue(samples);
        publishLevel(samples);
      },
      flush: () => {
        deps.player.flush();
        meter.reset();
        set({ level: ValueConstants.zero });
      },
      stop: () => deps.player.stop(),
    };

    const addExtra = (line: NewLine): void => {
      extraId += ValueConstants.one;
      const after = controller.getState().transcript.length;
      extras = [...extras, { after, line: { ...line, id: `${EXTRA_ID_PREFIX}${extraId}` } }];
      set({ transcript: toTranscriptLines(controller.getState().transcript, extras) });
    };

    /** A session failure in the app's words — or none, for what the pill already explains. */
    const sessionError = (failure: AssistantFailure | null): Failure | null => {
      if (failure === null) return null;
      if (failure.code === AssistantFailureCode.MicrophoneDenied) return null;
      // The old store tore a dropped socket down quietly; the pill going idle is the notice.
      if (failure.code === AssistantFailureCode.ConnectionLost) return null;
      if (failure.code === AssistantFailureCode.ConnectionRefused) {
        if (failure.cause instanceof GrantRefusal) return null;
        if (failure.cause instanceof Failure) return failure.cause;
      }
      return toAppFailure(failure);
    };

    const stopHeartbeat = (): void => {
      heartbeatEpoch += ValueConstants.one;
      if (heartbeat !== null) clearInterval(heartbeat);
      heartbeat = null;
    };

    const startHeartbeat = (): void => {
      stopHeartbeat();
      const ownEpoch = heartbeatEpoch;
      // Once per session, or a second session would run out in silence.
      let warned = false;
      heartbeat = setInterval(() => {
        void tokens.reportUsage(HEARTBEAT_SECONDS).then((reported) => {
          // A report in flight when the session ended must not write onto the next one.
          if (heartbeatEpoch !== ownEpoch || !reported.ok) return;
          set({ remainingSeconds: reported.value.remainingSeconds, isUnlimited: reported.value.isUnlimited });
          // An unmetered account's number is a floor, not a balance: nothing counts it down.
          if (reported.value.isUnlimited) return;
          if (reported.value.remainingSeconds <= ValueConstants.zero) {
            overlay = AssistantStatus.Unavailable;
            void controller.stop();
            return;
          }
          if (!warned && reported.value.remainingSeconds <= BUDGET_WARNING_SECONDS) {
            warned = true;
            controller.sendText(BUDGET_WARNING_PROMPT, { hidden: true });
          }
        });
      }, HEARTBEAT_INTERVAL_MS);
    };

    const sync = (): void => {
      const state = controller.getState();
      const patch: Partial<AssistantSessionStoreState> = {
        isMuted: state.isMuted,
        tokensUsed: state.tokensUsed,
        status: state.status !== SessionStatus.Idle ? state.status : (overlay ?? AssistantStatus.Idle),
      };
      if (state.transcript !== seenEntries) {
        seenEntries = state.transcript;
        patch.transcript = toTranscriptLines(state.transcript, extras);
      }
      if (state.error !== seenError) {
        seenError = state.error;
        patch.error = sessionError(state.error);
      }
      if (state.status === SessionStatus.Idle || state.isMuted) {
        meter.reset();
        patch.level = ValueConstants.zero;
      }
      const ended = previousStatus !== SessionStatus.Idle && state.status === SessionStatus.Idle;
      previousStatus = state.status;
      set(patch);

      if (ended) {
        stopHeartbeat();
        // Say that it ended: torn down in silence, the session simply was not there any more.
        if (state.endReason === EndReason.Silence) {
          addExtra({ kind: AssistantTranscriptLineKind.Action, action: AssistantAction.Stop });
        }
      }
    };

    controller = new AssistantController<LiveSessionCredentials>({
      session,
      microphone: deps.microphone,
      player,
      tools: new ToolRegistry([createRunActionTool(registry)]),
      getConnection: async ({ resumptionHandle }) => {
        const grant = await tokens.mintSession(languageCode, resumptionHandle);
        if (!grant.ok) throw grant.failure;
        if (grant.value.status === AssistantGrantStatus.Denied) {
          throw new GrantRefusal(grant.value.reason, grant.value.remainingSeconds);
        }
        set({ remainingSeconds: grant.value.remainingSeconds, isUnlimited: grant.value.isUnlimited });
        return grant.value.credentials;
      },
    });
    controller.subscribe(sync);

    /** What a start that failed leaves on the pill: a reason for a refusal, the failure for anything else. */
    const explainStartFailure = (failure: AssistantFailure): void => {
      if (failure.code === AssistantFailureCode.MicrophoneDenied) {
        overlay = AssistantStatus.Unavailable;
        set({ deniedReason: AssistantDenialReason.MicrophoneDenied });
      } else if (failure.code === AssistantFailureCode.ConnectionRefused && failure.cause instanceof GrantRefusal) {
        overlay = AssistantStatus.Unavailable;
        set({ deniedReason: failure.cause.reason, remainingSeconds: failure.cause.remainingSeconds, isUnlimited: false });
      } else if (failure.code === AssistantFailureCode.ConnectionRefused && failure.cause instanceof Failure) {
        overlay = AssistantStatus.Unavailable;
      }
      sync();
    };

    /** A typed turn with no live session: over HTTP, answered in the same transcript. */
    const askOverHttp = (text: string, locale: string): void => {
      addExtra({ kind: AssistantTranscriptLineKind.Speech, speaker: ChatRole.User, text });
      // An empty screen line is omitted: the backend appends it to the prompt.
      const screen = registry.screenContext;
      const context = screen === CharConstants.empty ? undefined : screen;
      const askedAt = typedEpoch;
      overlay = AssistantStatus.Working;
      sync();

      // Queued, so two typed commands in quick succession cannot race each other.
      typedQueue = typedQueue.then(async () => {
        const answered = await messenger.ask(text, locale, context);
        // Signed out or started voice meanwhile: the answer belongs to nothing on screen.
        if (typedEpoch !== askedAt) return;
        overlay = null;
        if (!answered.ok) {
          set({ error: answered.failure });
          sync();
          return;
        }

        set({ error: null });
        if (answered.value.reply !== CharConstants.empty) {
          addExtra({ kind: AssistantTranscriptLineKind.Speech, speaker: ChatRole.Assistant, text: answered.value.reply });
        }
        const action = answered.value.action;
        if (action !== undefined) {
          const result = await registry.run(action.name, action.arg);
          if (result.ok && isAssistantAction(action.name)) {
            const detail = actionDetail(action.arg, { ...result });
            addExtra({ kind: AssistantTranscriptLineKind.Action, action: action.name, ...(detail !== undefined ? { detail } : {}) });
          }
          // An action that could not run is news: the user was told it was happening.
          if (!result.ok) {
            set({ error: new UnknownFailure(DiagnosticMessage.assistant.actionFailed(result.error ?? CharConstants.empty)) });
          }
        }
        sync();
      });
    };

    return {
      status: AssistantStatus.Idle,
      view: AssistantView.Closed,
      level: ValueConstants.zero,
      isMuted: false,
      transcript: [],
      remainingSeconds: ValueConstants.zero,
      isUnlimited: false,
      tokensUsed: ValueConstants.zero,
      deniedReason: null,
      error: null,

      setView: (view) => set({ view }),

      toggleMute: () => {
        controller.toggleMute();
        // The waveform goes with the mute: a bar moving over a muted microphone says audio is going out.
        meter.reset();
        set({ level: ValueConstants.zero });
      },

      startVoice: async (locale: string) => {
        // Not "is it idle": a refused session leaves Unavailable, and the next press must start.
        if (assistantIsLive(get().status)) return;
        typedEpoch += ValueConstants.one;
        overlay = null;
        languageCode = locale;
        set({ deniedReason: null, error: null });

        const started = await controller.start();
        if (!started.ok) {
          explainStartFailure(started.failure);
          return;
        }
        if (assistantIsLive(controller.getState().status)) startHeartbeat();
      },

      stopVoice: async () => {
        overlay = null;
        await controller.stop();
        sync();
      },

      sendText: (text: string, locale: string) => {
        if (text === CharConstants.empty) return;
        // A live session carries the turn; anything else — Connecting included, whose socket
        // is not yet acknowledged — goes over HTTP.
        if (controller.sendText(text)) return;
        askOverHttp(text, locale);
      },

      clearError: () => set({ error: null }),

      reset: () => {
        typedEpoch += ValueConstants.one;
        overlay = null;
        extras = [];
        void controller.stop();
        controller.clearTranscript();
        meter.reset();
        set({
          transcript: [],
          remainingSeconds: ValueConstants.zero,
          isUnlimited: false,
          tokensUsed: ValueConstants.zero,
          deniedReason: null,
          error: null,
          view: AssistantView.Closed,
          level: ValueConstants.zero,
          isMuted: false,
        });
      },
    };
  });
};
