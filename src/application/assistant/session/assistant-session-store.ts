import { AssistantEventKind } from '@domain/assistant/session/assistant-event-kind';
import { AssistantGrantStatus } from '@domain/assistant/session/assistant-grant-status';
import { AssistantStatus } from '@application/assistant/session/assistant-status';
import type { AssistantActionRegistry } from '@application/assistant/actions/assistant-action-registry';
import type { AssistantSessionEventType } from '@domain/assistant/session/assistant-session-event';
import type { AssistantSessionInterface } from '@domain/assistant/session/assistant-session-interface';
import type { AssistantSessionStoreState } from '@application/assistant/session/assistant-session-store-state';
import type { AssistantTokenRepositoryInterface } from '@domain/assistant/session/assistant-token-repository-interface';
import type { AudioPlayerInterface } from '@domain/assistant/audio/audio-player-interface';
import type { BoundStore } from '@application/store/bound-store';
import { CharConstants, ValueConstants } from '@core/constants';
import { ChatRole } from '@domain/drafts/chat-role';
import { create } from 'zustand';
import type { MicrophoneInterface } from '@domain/assistant/audio/microphone-interface';

interface AssistantSessionStoreDeps {
  session: AssistantSessionInterface;
  microphone: MicrophoneInterface;
  player: AudioPlayerInterface;
  tokens: AssistantTokenRepositoryInterface;
  registry: AssistantActionRegistry;
}

/**
 * Runs a voice session: mint, connect, microphone in, audio out, tool calls.
 *
 * @remarks
 * - **The microphone opens only after `setupComplete`.** The socket accepts
 *   writes before the server has agreed to the session, and audio sent in that
 *   window is discarded silently — so a user who started talking immediately
 *   would be ignored with nothing to show for it.
 * - **Interruption is a flush, not a stop.** `interrupted` arrives while the
 *   model is still producing; dropping the queued audio is the whole gesture,
 *   and the tokens already spent on what was never heard are not recoverable
 *   either way.
 * - **Heartbeats are what make the budget real.** The server cannot see a
 *   socket it is not part of, so a session that never reported could run all
 *   day for free — and one that dies mid-conversation has already paid for the
 *   seconds it used, which is why the report is a delta on a timer rather than
 *   a total at the end.
 * - **Tool calls are serialised.** The model sends several in one frame when
 *   the user asks for several things, and each is meant to see what the last
 *   one did — "open the recipe and share it" is nonsense if the share runs
 *   against the screen the open was still pushing.
 * - **Silence closes the session.** Voice is billed per second of an open
 *   microphone, so a session left running in a pocket is the single most
 *   expensive thing this feature can do.
 */
const HEARTBEAT_INTERVAL_MS = 15_000;
const HEARTBEAT_SECONDS = 15;
const SILENCE_TIMEOUT_MS = 8_000;
const MIC_SAMPLE_RATE = 16_000;
const PLAYBACK_SAMPLE_RATE = 24_000;

export const configureAssistantSessionStore = (
  deps: AssistantSessionStoreDeps,
): BoundStore<AssistantSessionStoreState> => {
  const { session, microphone, player, tokens, registry } = deps;

  let unsubscribe: (() => void) | null = null;
  // Tool calls run ONE AT A TIME, in arrival order. The model routinely sends
  // several in a single frame — "make a recipe and then share it" is two — and
  // running them concurrently raced: the share fired against the screen the
  // create was still opening. A queue is also what lets a later call see what
  // an earlier one did, which is the whole reason the model chains them.
  let toolQueue: Promise<void> = Promise.resolve();
  let heartbeat: ReturnType<typeof setInterval> | null = null;
  let silence: ReturnType<typeof setTimeout> | null = null;
  let lineId = ValueConstants.zero;

  return create<AssistantSessionStoreState>((set, get) => {
    const stopTimers = (): void => {
      if (heartbeat !== null) clearInterval(heartbeat);
      if (silence !== null) clearTimeout(silence);
      heartbeat = null;
      silence = null;
    };

    const teardown = async (status: AssistantSessionStoreState['status']): Promise<void> => {
      stopTimers();
      // A queue left holding a rejected promise would swallow every later call
      // silently; the session is over either way, so it starts clean.
      toolQueue = Promise.resolve();
      unsubscribe?.();
      unsubscribe = null;
      await microphone.stop();
      await player.stop();
      session.close();
      set({ status });
    };

    const nudgeSilenceTimer = (): void => {
      if (silence !== null) clearTimeout(silence);
      silence = setTimeout(() => {
        void teardown(AssistantStatus.Idle);
      }, SILENCE_TIMEOUT_MS);
    };

    const appendTranscript = (speaker: ChatRole, text: string): void => {
      lineId += ValueConstants.one;
      set({ transcript: [...get().transcript, { id: String(lineId), speaker, text }] });
    };

    const handle = (event: AssistantSessionEventType): void => {
      switch (event.kind) {
        case AssistantEventKind.Transcript:
          appendTranscript(event.speaker, event.text);
          nudgeSilenceTimer();
          break;
        case AssistantEventKind.Audio:
          set({ status: AssistantStatus.Speaking });
          player.enqueue(event.samples);
          nudgeSilenceTimer();
          break;
        case AssistantEventKind.Interrupted:
          // Everything queued but unheard is dropped here. Anything else — a
          // stop, a fade — leaves the assistant finishing the sentence the
          // user just talked over.
          player.flush();
          set({ status: AssistantStatus.Listening });
          break;
        case AssistantEventKind.TurnComplete:
          set({ status: AssistantStatus.Listening });
          break;
        case AssistantEventKind.ToolCall: {
          set({ status: AssistantStatus.Working });
          const { callId, action, arg } = event;
          toolQueue = toolQueue.then(async () => {
            const result = await registry.run(action, arg);
            session.respondToTool(callId, { ...result });
          });
          break;
        }
        case AssistantEventKind.Closed:
          void teardown(AssistantStatus.Idle);
          break;
        default:
          break;
      }
    };

    return {
      status: AssistantStatus.Idle,
      isPanelOpen: false,
      transcript: [],
      remainingSeconds: ValueConstants.zero,
      deniedReason: null,
      error: null,

      openPanel: () => set({ isPanelOpen: true }),
      closePanel: () => set({ isPanelOpen: false }),

      startVoice: async (languageCode: string) => {
        if (get().status !== AssistantStatus.Idle) return;
        set({ status: AssistantStatus.Connecting, error: null, deniedReason: null });

        const grant = await tokens.mintSession(languageCode);
        if (!grant.ok) {
          set({ status: AssistantStatus.Unavailable, error: grant.failure });
          return;
        }
        if (grant.value.status === AssistantGrantStatus.Denied) {
          set({
            status: AssistantStatus.Unavailable,
            deniedReason: grant.value.reason,
            remainingSeconds: grant.value.remainingSeconds,
          });
          return;
        }

        set({ remainingSeconds: grant.value.remainingSeconds });
        unsubscribe = session.subscribe(handle);

        const connected = await session.connect(grant.value.credentials);
        if (!connected.ok) {
          await teardown(AssistantStatus.Idle);
          set({ error: connected.failure });
          return;
        }

        const output = await player.prepare(PLAYBACK_SAMPLE_RATE);
        if (!output.ok) {
          await teardown(AssistantStatus.Idle);
          set({ error: output.failure });
          return;
        }

        const input = await microphone.start(MIC_SAMPLE_RATE, (samples) => session.sendAudio(samples));
        if (!input.ok) {
          await teardown(AssistantStatus.Idle);
          set({ error: input.failure });
          return;
        }

        heartbeat = setInterval(() => {
          void tokens.reportUsage(HEARTBEAT_SECONDS).then((reported) => {
            if (!reported.ok) return;
            set({ remainingSeconds: reported.value });
            if (reported.value <= ValueConstants.zero) void teardown(AssistantStatus.Unavailable);
          });
        }, HEARTBEAT_INTERVAL_MS);
        nudgeSilenceTimer();
        set({ status: AssistantStatus.Listening });
      },

      stopVoice: async () => {
        await teardown(AssistantStatus.Idle);
      },

      sendText: (text: string) => {
        if (text === CharConstants.empty) return;
        appendTranscript(ChatRole.User, text);
        session.sendText(text);
      },

      clearError: () => set({ error: null }),

      reset: () => {
        void teardown(AssistantStatus.Idle);
        set({
          transcript: [],
          remainingSeconds: ValueConstants.zero,
          deniedReason: null,
          error: null,
          isPanelOpen: false,
        });
      },
    };
  });
};
