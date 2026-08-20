import { AssistantEventKind } from '@domain/assistant/session/assistant-event-kind';
import { AssistantGrantStatus } from '@domain/assistant/session/assistant-grant-status';
import { AssistantStatus } from '@application/assistant/session/assistant-status';
import type { AssistantActionRegistry } from '@application/assistant/actions/assistant-action-registry';
import type { AssistantSessionEventType } from '@domain/assistant/session/assistant-session-event';
import type { AssistantSessionInterface } from '@domain/assistant/session/assistant-session-interface';
import type { AssistantSessionStoreState } from '@application/assistant/session/assistant-session-store-state';
import type { AssistantMessengerInterface } from '@domain/assistant/session/assistant-messenger-interface';
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
  messenger: AssistantMessengerInterface;
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
 * - **A `goAway` is survived, not obeyed.** The server drops the socket roughly
 *   every ten minutes by design; a session that read that as the end would die
 *   mid-conversation on a timer. The handle it sent is minted into a new token
 *   and a fresh socket continues the same conversation, with the microphone
 *   and the player left running — the user hears a pause, not a stop.
 * - **Silence closes the session.** Voice is billed per second of an open
 *   microphone, so a session left running in a pocket is the single most
 *   expensive thing this feature can do.
 */
const HEARTBEAT_INTERVAL_MS = 15_000;
const HEARTBEAT_SECONDS = 15;
const SILENCE_TIMEOUT_MS = 8_000;
/**
 * How many handovers in a row are tolerated before the session is given up.
 *
 * A `goAway` is normal roughly every ten minutes, so several in a session is
 * expected over a long conversation — but several with no completed turn
 * between them means the handover itself is failing, and retrying it forever
 * bills the backend for a session nobody is having.
 */
const MAX_HANDOVERS = 3;
const MIC_SAMPLE_RATE = 16_000;
const PLAYBACK_SAMPLE_RATE = 24_000;

export const configureAssistantSessionStore = (
  deps: AssistantSessionStoreDeps,
): BoundStore<AssistantSessionStoreState> => {
  const { session, microphone, player, tokens, messenger, registry } = deps;

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
  // What a reconnect needs. The handle lets the next socket continue the
  // conversation instead of paying for setup and context again, and the
  // language is fixed at mint time so it has to survive the old session.
  let resumptionHandle: string | null = null;
  let languageCode = CharConstants.empty;
  let expectingGoAway = false;
  // Bumped by every start and every teardown, so a reconnect that was already
  // in flight can tell whether the session it belongs to still exists. Saying
  // "stop" during the handover otherwise opened a fresh socket AFTER the
  // microphone had been closed — a session nobody could hear or end.
  let epoch = ValueConstants.zero;
  // Consecutive handovers with no conversation between them. A server that
  // re-issues goAway immediately would otherwise mint and connect in a loop,
  // billing the backend for a session nobody is having.
  let handovers = ValueConstants.zero;

  return create<AssistantSessionStoreState>((set, get) => {
    const stopTimers = (): void => {
      if (heartbeat !== null) clearInterval(heartbeat);
      if (silence !== null) clearTimeout(silence);
      heartbeat = null;
      silence = null;
    };

    const teardown = async (status: AssistantSessionStoreState['status']): Promise<void> => {
      epoch += ValueConstants.one;
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

    /**
     * Continues the conversation on a fresh socket after a `goAway`.
     *
     * The microphone and the player stay up: only the transport is replaced,
     * so the user hears a pause rather than a session ending. Frames captured
     * during the gap are dropped by the transport, which is the right trade —
     * a second of audio against a conversation.
     *
     * It goes through the backend rather than reconnecting directly, because
     * the handle has to be minted into the new token; that round trip is also
     * where the daily budget is re-checked, which is why running out mid-
     * session ends it here rather than silently continuing.
     */
    const reconnect = async (): Promise<void> => {
      handovers += ValueConstants.one;
      if (handovers > MAX_HANDOVERS) {
        await teardown(AssistantStatus.Idle);
        return;
      }

      const startedAt = epoch;
      // The old socket's calls can never be answered — their ids belong to a
      // session that no longer exists — so the queue starts empty rather than
      // replying to the new socket with the old one's callIds.
      toolQueue = Promise.resolve();
      const grant = await tokens.mintSession(languageCode, resumptionHandle ?? undefined);
      if (epoch !== startedAt) return;

      if (!grant.ok || grant.value.status === AssistantGrantStatus.Denied) {
        await teardown(AssistantStatus.Idle);
        return;
      }

      set({ remainingSeconds: grant.value.remainingSeconds });
      const connected = await session.connect(grant.value.credentials);
      // Checked again: the mint and the connect are both awaited, and the user
      // can say "stop" during either.
      if (epoch !== startedAt) {
        session.close();
        return;
      }
      if (!connected.ok) {
        await teardown(AssistantStatus.Idle);
        return;
      }
      // The pill was left mid-utterance — the turn it was showing died with
      // the socket — so it goes back to listening rather than staying stuck on
      // "speaking" until the next event arrives.
      set({ status: AssistantStatus.Listening });
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
          // A completed turn is a conversation that is happening, so the
          // handover counter starts again from here.
          handovers = ValueConstants.zero;
          set({ status: AssistantStatus.Listening });
          nudgeSilenceTimer();
          break;
        case AssistantEventKind.ToolCall: {
          set({ status: AssistantStatus.Working });
          // A generate or a refine takes longer than the silence timeout, and
          // the user is watching it work rather than talking. Without this the
          // session tore itself down mid-action and the answer never arrived.
          nudgeSilenceTimer();
          const { callId, action, arg } = event;
          toolQueue = toolQueue.then(async () => {
            const result = await registry.run(action, arg);
            session.respondToTool(callId, { ...result });
          });
          break;
        }
        case AssistantEventKind.Resumption:
          resumptionHandle = event.handle;
          break;
        case AssistantEventKind.GoAway:
          // Not a close: a warning that one is coming. The socket is dropped
          // roughly every ten minutes by design, and a session that treated
          // that as the end would die mid-conversation on a timer.
          expectingGoAway = true;
          break;
        case AssistantEventKind.Usage:
          set({ tokensUsed: event.totalTokens });
          break;
        case AssistantEventKind.Closed:
          // A close the app asked for is already being handled by whoever
          // asked; re-entering teardown here would fight it.
          if (event.expected) break;
          if (expectingGoAway && resumptionHandle !== null) {
            expectingGoAway = false;
            void reconnect();
            break;
          }
          void teardown(AssistantStatus.Idle);
          break;
        case AssistantEventKind.Ready:
          // `connect` already resolved on this; nothing further to do.
          break;
        default:
          // Exhaustive: the union is closed and the mapper is its only
          // producer, so a new kind must be handled here rather than silently
          // dropped. `Resumption`, `GoAway` and `Usage` were dropped for
          // exactly as long as this was a bare `break` — the whole
          // reconnect path was dead and nothing said so.
          assertNever(event);
      }
    };

    return {
      status: AssistantStatus.Idle,
      isPanelOpen: false,
      transcript: [],
      remainingSeconds: ValueConstants.zero,
      tokensUsed: ValueConstants.zero,
      deniedReason: null,
      error: null,

      openPanel: () => set({ isPanelOpen: true }),
      closePanel: () => set({ isPanelOpen: false }),

      startVoice: async (locale: string) => {
        if (get().status !== AssistantStatus.Idle) return;
        set({ status: AssistantStatus.Connecting, error: null, deniedReason: null });
        languageCode = locale;
        resumptionHandle = null;
        expectingGoAway = false;
        handovers = ValueConstants.zero;
        epoch += ValueConstants.one;

        const grant = await tokens.mintSession(locale);
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

      sendText: (text: string, locale: string) => {
        if (text === CharConstants.empty) return;
        appendTranscript(ChatRole.User, text);

        // A live session carries the turn; without one it goes over HTTP. That
        // second path is the whole point of the text mode: out of budget there
        // is no socket, and this used to write the user's message into the
        // transcript and drop it — which looked exactly like being ignored.
        if (get().status !== AssistantStatus.Idle && get().status !== AssistantStatus.Unavailable) {
          session.sendText(text);
          return;
        }

        // An empty screen line is omitted rather than sent: the backend
        // appends it to the prompt, and an empty bracket is a token spent
        // saying nothing.
        const screen = registry.screenContext;
        const context = screen === CharConstants.empty ? undefined : screen;
        void messenger.ask(text, locale, context).then((answered) => {
          if (!answered.ok) {
            set({ error: answered.failure });
            return;
          }
          if (answered.value.reply !== CharConstants.empty) {
            appendTranscript(ChatRole.Assistant, answered.value.reply);
          }
          const action = answered.value.action;
          if (action !== undefined) void registry.run(action.name, action.arg);
        });
      },

      clearError: () => set({ error: null }),

      reset: () => {
        void teardown(AssistantStatus.Idle);
        set({
          transcript: [],
          remainingSeconds: ValueConstants.zero,
          tokensUsed: ValueConstants.zero,
          deniedReason: null,
          error: null,
          isPanelOpen: false,
        });
      },
    };
  });
};

/**
 * Fails to compile when a new event kind is added without being handled.
 *
 * The alternative — a `default` that breaks — is right for a union that grows
 * server-side, and wrong for this one: it is declared in the domain and the
 * mapper is its only producer, so every variant is known at build time. Three
 * of them were being discarded, and nothing anywhere reported it.
 */
function assertNever(event: never): void {
  void event;
}
