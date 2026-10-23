import type { AssistantSessionState } from '@application/assistant/session/assistant-session-state';
import type { AssistantDenialReasonType } from '@domain/assistant/session/assistant-denial-reason';
import { createStore } from 'zustand/vanilla';
import {
  AssistantController,
  AssistantStatus as SessionStatus,
  EndReason,
  ToolRegistry,
} from '@live-assistant/core';
import type { AssistantFailure, AssistantMicrophone, AssistantPlayer, AssistantSession, TranscriptEntry } from '@live-assistant/core';
import { AssistantLevelMeter } from '@application/assistant/session/assistant-level-meter';
import { assistantIsLive } from '@application/assistant/session/assistant-is-live';
import { createRunActionTool } from '@application/assistant/session/assistant-live-tool';
import { AssistantStatus } from '@application/assistant/session/assistant-status';
import type { AssistantStatusType } from '@application/assistant/session/assistant-status';
import { AssistantHeartbeat } from '@application/assistant/session/runtime/assistant-heartbeat';
import { AssistantTranscriptExtras } from '@application/assistant/session/runtime/assistant-transcript-extras';
import { meteredAssistantIo } from '@application/assistant/session/runtime/metered-assistant-io';
import { AssistantTranscriptLineKind } from '@application/assistant/session/assistant-transcript-line-kind';
import { AssistantView } from '@application/assistant/session/assistant-view';
import { AssistantFailurePolicy } from '@application/assistant/session/assistant-failure-policy';
import type { AskAssistantUseCase } from '@application/assistant/session/ask-assistant-use-case';
import type { RunAssistantActionUseCase } from '@application/assistant/actions/run-assistant-action-use-case';
import type { AssistantActionRegistry } from '@application/assistant/actions/assistant-action-registry';
import type { AssistantSessionStore } from '@application/assistant/session/assistant-session-store-contract';
import type { StoreApi } from 'zustand/vanilla';
import { AssistantAction } from '@domain/assistant/actions/assistant-action-type';
import { AssistantGrantStatus } from '@domain/assistant/session/assistant-grant-status';
import type { AssistantTokenRepositoryInterface } from '@domain/assistant/session/assistant-token-repository-interface';
import type { LiveSessionCredentials } from '@domain/assistant/session/live-session-credentials';
import { ChatRole } from '@domain/drafts/chat-role';
import { CharConstants, ValueConstants } from '@core/constants';

interface AssistantSessionStoreDeps {
  session: AssistantSession<LiveSessionCredentials>;
  microphone: AssistantMicrophone;
  player: AssistantPlayer;
  tokens: AssistantTokenRepositoryInterface;
  registry: AssistantActionRegistry;
  askAssistant: AskAssistantUseCase;
  runAction: RunAssistantActionUseCase;
}

/**
 * What the model is told when the budget is nearly gone: an instruction, not a
 * sentence to repeat — the session knows which language it is speaking.
 */
const BUDGET_WARNING_PROMPT =
  'SYSTEM: about one minute of voice time remains today. Tell the user briefly, ' +
  'in the language you are speaking, that you are almost out of time and they ' +
  'can keep going by typing. Say nothing else and call no action.';

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
 * - **The budget.** The server cannot see a socket it is not part of, so
 *   `AssistantHeartbeat` reports seconds while live; a metered account at zero ends the
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
): StoreApi<AssistantSessionStore> => {
  const { tokens, registry, askAssistant, runAction } = deps;
  const meter = new AssistantLevelMeter();
  let languageCode = CharConstants.empty;
  let overlay: AssistantStatusType | null = null;
  /** Why the last start was refused; read only while the session is `Unavailable`. */
  let denied: AssistantDenialReasonType | null = null;
  const extras = new AssistantTranscriptExtras();
  let typedEpoch = ValueConstants.zero;
  let typedQueue: Promise<void> = Promise.resolve();
  let seenError: AssistantFailure | null = null;
  let seenEntries: readonly TranscriptEntry[] | null = null;
  let previousStatus: string = SessionStatus.Idle;

  return createStore<AssistantSessionStore>((set, get) => {
    let controller!: AssistantController<LiveSessionCredentials>;

    const { session, player } = meteredAssistantIo(deps.session, deps.player, {
      isCapturing: () => {
        const { status } = controller.getState();
        return status !== SessionStatus.Idle && status !== SessionStatus.Speaking;
      },
      publish: (samples) => {
        const level = meter.measure(samples);
        if (level !== null) set({ level });
      },
      onFlush: () => {
        meter.reset();
        set({ level: ValueConstants.zero });
      },
    });

    const addExtra = (line: Parameters<AssistantTranscriptExtras['add']>[0]): void => {
      extras.add(line, controller.getState().transcript.length);
      set({ transcript: extras.merge(controller.getState().transcript) });
    };

    const heartbeat = new AssistantHeartbeat(tokens, {
      onUsage: ({ remainingSeconds, isUnlimited }) => set({ remainingSeconds, isUnlimited }),
      onExhausted: () => {
        overlay = AssistantStatus.Unavailable;
        void controller.stop();
      },
      onNearlyOut: () => controller.sendText(BUDGET_WARNING_PROMPT, { hidden: true }),
    });

    /** The named state for a status; the refusal reason rides only on `Unavailable`. */
    const sessionFor = (status: AssistantStatusType): AssistantSessionState =>
      status === AssistantStatus.Unavailable ? { status, deniedReason: denied } : { status };

    const sync = (): void => {
      const state = controller.getState();
      const patch: Partial<AssistantSessionStore> = {
        isMuted: state.isMuted,
        tokensUsed: state.tokensUsed,
        session: sessionFor(state.status !== SessionStatus.Idle ? state.status : (overlay ?? AssistantStatus.Idle)),
      };
      if (state.transcript !== seenEntries) {
        seenEntries = state.transcript;
        patch.transcript = extras.merge(state.transcript);
      }
      if (state.error !== seenError) {
        seenError = state.error;
        patch.error = AssistantFailurePolicy.toSessionError(state.error);
      }
      if (state.status === SessionStatus.Idle || state.isMuted) {
        meter.reset();
        patch.level = ValueConstants.zero;
      }
      const hasEnded = previousStatus !== SessionStatus.Idle && state.status === SessionStatus.Idle;
      previousStatus = state.status;
      set(patch);

      if (hasEnded) {
        heartbeat.stop();
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
      // No generic page pack: the app declares its own actions for the same acts.
      page: false,
      getConnection: async ({ resumptionHandle }) => {
        const grant = await tokens.mintSession(languageCode, resumptionHandle);
        if (!grant.ok) throw grant.failure;
        if (grant.value.status === AssistantGrantStatus.Denied) {
          throw AssistantFailurePolicy.refusal(grant.value.reason, grant.value.remainingSeconds);
        }
        set({ remainingSeconds: grant.value.remainingSeconds, isUnlimited: grant.value.isUnlimited });
        return grant.value.credentials;
      },
    });
    controller.subscribe(sync);

    /** A typed turn with no live session: over HTTP, answered in the same transcript. */
    const askOverHttp = (text: string, locale: string): void => {
      addExtra({ kind: AssistantTranscriptLineKind.Speech, speaker: ChatRole.User, text });
      const screen = registry.screenContext;
      const askedAt = typedEpoch;
      overlay = AssistantStatus.Working;
      sync();

      // Queued, so two typed commands in quick succession cannot race each other.
      typedQueue = typedQueue.then(async () => {
        const answered = await askAssistant.execute(text, locale, screen);
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
        if (answered.value.action !== undefined) {
          const ran = await runAction.execute(answered.value.action);
          if (!ran.ok) set({ error: ran.failure });
          else if (ran.value !== null) addExtra(ran.value);
        }
        sync();
      });
    };

    return {
      session: { status: AssistantStatus.Idle },
      view: AssistantView.Closed,
      level: ValueConstants.zero,
      isMuted: false,
      transcript: [],
      remainingSeconds: ValueConstants.zero,
      isUnlimited: false,
      tokensUsed: ValueConstants.zero,
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
        if (assistantIsLive(get().session.status)) return;
        typedEpoch += ValueConstants.one;
        overlay = null;
        languageCode = locale;
        denied = null;
        set({ error: null });

        const started = await controller.start();
        if (!started.ok) {
          // A refusal leaves a reason on the pill; anything else, the failure.
          const denial = AssistantFailurePolicy.toStartDenial(started.failure);
          if (denial !== null) {
            overlay = AssistantStatus.Unavailable;
            const { deniedReason, ...budget } = denial;
            if (deniedReason !== undefined) denied = deniedReason;
            if (Object.keys(budget).length > ValueConstants.zero) set(budget);
          }
          sync();
          return;
        }
        if (assistantIsLive(controller.getState().status)) heartbeat.start();
      },

      stopVoice: async () => {
        overlay = null;
        await controller.stop();
        sync();
      },

      sendText: (text: string, locale: string) => {
        if (text === CharConstants.empty) return;
        // Only a live session carries text; anything else (Connecting included) uses HTTP.
        if (controller.sendText(text)) return;
        askOverHttp(text, locale);
      },

      clearError: () => set({ error: null }),

      reset: () => {
        typedEpoch += ValueConstants.one;
        overlay = null;
        denied = null;
        extras.clear();
        void controller.stop();
        controller.clearTranscript();
        meter.reset();
        set({
          transcript: [],
          remainingSeconds: ValueConstants.zero,
          isUnlimited: false,
          tokensUsed: ValueConstants.zero,
          error: null,
          session: { status: AssistantStatus.Idle },
          view: AssistantView.Closed,
          level: ValueConstants.zero,
          isMuted: false,
        });
      },
    };
  });
};
