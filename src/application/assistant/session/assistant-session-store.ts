import { DiagnosticMessage } from '@core/failure/diagnostic-message';
import { UnknownFailure } from '@core/failure/kinds/unknown-failure';
import { AssistantEventKind } from '@domain/assistant/session/assistant-event-kind';
import { AssistantGrantStatus } from '@domain/assistant/session/assistant-grant-status';
import { AssistantLevelMeter } from '@application/assistant/session/assistant-level-meter';
import { AssistantStatus, LIVE_STATUSES } from '@application/assistant/session/assistant-status';
import { AssistantTranscriptLineKind } from '@application/assistant/session/assistant-transcript-line-kind';
import { AssistantView } from '@application/assistant/session/assistant-view';
import type { AssistantActionRegistry } from '@application/assistant/actions/assistant-action-registry';
import type { AssistantActionResultType } from '@domain/assistant/actions/assistant-action-result';
import type { AssistantActionType } from '@domain/assistant/actions/assistant-action-type';
import type { AssistantSessionEventType } from '@domain/assistant/session/assistant-session-event';
import type { AssistantSessionInterface } from '@domain/assistant/session/assistant-session-interface';
import type { AssistantSessionStoreState } from '@application/assistant/session/assistant-session-store-state';
import type { AssistantTranscriptLine } from '@application/assistant/session/assistant-transcript-line';
import type { AssistantMessengerInterface } from '@domain/assistant/session/assistant-messenger-interface';
import type { AssistantTokenRepositoryInterface } from '@domain/assistant/session/assistant-token-repository-interface';
import type { AudioPlayerInterface } from '@domain/assistant/audio/audio-player-interface';
import type { BoundStore } from '@application/store/bound-store';
import { CharConstants, ValueConstants } from '@core/constants';
import { ChatRole } from '@domain/drafts/chat-role';
import { create } from 'zustand';
import { isAssistantAction } from '@domain/assistant/actions/is-assistant-action';
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
 * - **The level is published on a clock, not per frame.** Audio arrives dozens
 *   of times a second from both sides, and each value written here re-renders
 *   every subscriber; `AssistantLevelMeter` decides which frames are worth a
 *   render, and this file decides when the answer is silence — a bar left
 *   moving after a session ends reads as a microphone that is still open.
 * - **Muting is a withheld frame.** The capture callback returns without
 *   sending, so the model hears silence; a flag the UI merely renders would
 *   leave the room going out over the socket with a crossed-out icon on top.
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
  const meter = new AssistantLevelMeter();
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
      // A waveform still moving under a session that has ended reads as a live
      // microphone, and a mute carried into the next session would silence it
      // before the user had said anything.
      meter.reset();
      set({ status, level: ValueConstants.zero, isMuted: false });
    };

    const nudgeSilenceTimer = (): void => {
      if (silence !== null) clearTimeout(silence);
      silence = setTimeout(() => {
        void teardown(AssistantStatus.Idle);
      }, SILENCE_TIMEOUT_MS);
    };

    const publishLevel = (samples: Float32Array<ArrayBuffer>): void => {
      const level = meter.measure(samples);
      if (level !== null) set({ level });
    };

    const silenceLevel = (): void => {
      meter.reset();
      set({ level: ValueConstants.zero });
    };

    const nextLineId = (): string => {
      lineId += ValueConstants.one;
      return String(lineId);
    };

    const appendTranscript = (speaker: ChatRole, text: string): void => {
      const line = { kind: AssistantTranscriptLineKind.Speech, id: nextLineId(), speaker, text } as const;
      set({ transcript: [...get().transcript, line] });
    };

    /**
     * Records that something was DONE, between the lines that were said.
     *
     * Only for an action that ran: one the user refused or that could not be
     * performed did not happen, and a chip claiming it did is worse than no
     * chip at all — they are watching the app to see whether it obeyed.
     */
    const appendAction = (
      action: AssistantActionType,
      arg: string | undefined,
      result: AssistantActionResultType,
    ): void => {
      if (!result.ok) return;
      const line: AssistantTranscriptLine = {
        kind: AssistantTranscriptLineKind.Action,
        id: nextLineId(),
        action,
        detail: actionDetail(arg, result),
      };
      set({ transcript: [...get().transcript, line] });
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
      // Every in-flight call belongs to the session that is ending; the epoch
      // bump is what tells them so, and the queue starts clean for the new one.
      epoch += ValueConstants.one;
      handovers += ValueConstants.one;
      if (handovers > MAX_HANDOVERS) {
        await teardown(AssistantStatus.Idle);
        return;
      }

      const startedAt = epoch;
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
          // While the model speaks the waveform follows IT: the microphone is
          // still open, and a bar driven by the room would move to whatever is
          // happening in it rather than to the voice the user is listening to.
          publishLevel(event.samples);
          nudgeSilenceTimer();
          break;
        case AssistantEventKind.Interrupted:
          // Everything queued but unheard is dropped here. Anything else — a
          // stop, a fade — leaves the assistant finishing the sentence the
          // user just talked over.
          player.flush();
          silenceLevel();
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
          const raisedAt = epoch;
          toolQueue = toolQueue.then(async () => {
            const result = await registry.run(action, arg);
            // Rebinding the queue on a handover does not cancel a call already
            // running. Without this check it answered the NEW socket with a
            // callId from the dead session — a response to a question that
            // socket never asked.
            if (epoch !== raisedAt) return;
            if (isAssistantAction(action)) appendAction(action, arg, result);
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
      view: AssistantView.Closed,
      level: ValueConstants.zero,
      isMuted: false,
      transcript: [],
      remainingSeconds: ValueConstants.zero,
      tokensUsed: ValueConstants.zero,
      deniedReason: null,
      error: null,

      setView: (view) => set({ view }),

      toggleMute: () => {
        // The waveform goes with the mute, in the same set: a bar still moving
        // over a muted microphone says audio is going out, which is the one
        // thing the control promises it is not.
        meter.reset();
        set({ isMuted: !get().isMuted, level: ValueConstants.zero });
      },

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

        const input = await microphone.start(MIC_SAMPLE_RATE, (samples) => {
          // Muting withholds the frame itself. Anything softer — a flag the UI
          // reads, a gain of zero — still sends the room to the model, which
          // is what the user pressed the button to stop.
          if (get().isMuted) return;
          session.sendAudio(samples);
          if (get().status !== AssistantStatus.Speaking) publishLevel(samples);
        });
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

        // A live session carries the turn; anything else goes over HTTP. The
        // list is positive on purpose — `Connecting` has a socket that is not
        // yet acknowledged, and a turn written into that window is discarded
        // by the server, which is the same silence this whole path exists to
        // remove.
        if (LIVE_STATUSES.includes(get().status)) {
          session.sendText(text);
          return;
        }

        // An empty screen line is omitted rather than sent: the backend
        // appends it to the prompt, and an empty bracket is a token spent
        // saying nothing.
        const screen = registry.screenContext;
        const context = screen === CharConstants.empty ? undefined : screen;
        const askedAt = epoch;
        set({ status: AssistantStatus.Working });

        // Queued with the spoken calls, for the same reason they are queued
        // with each other: two typed commands in quick succession would
        // otherwise race, and the second could act on the screen the first was
        // still opening.
        toolQueue = toolQueue.then(async () => {
          const answered = await messenger.ask(text, locale, context);
          // The user can sign out or start voice while this is in flight; a
          // reply landing afterwards would append the previous session's line
          // to the next one's transcript and run its action.
          if (epoch !== askedAt) return;

          // The failure is surfaced through `error`, which the panel renders.
          // Written to state nothing read, an unreachable backend produced the
          // user's line and then silence — the exact symptom this mode exists
          // to remove.
          if (!answered.ok) {
            set({ status: AssistantStatus.Idle, error: answered.failure });
            return;
          }

          if (answered.value.reply !== CharConstants.empty) {
            appendTranscript(ChatRole.Assistant, answered.value.reply);
          }
          const action = answered.value.action;
          if (action !== undefined) {
            const result = await registry.run(action.name, action.arg);
            if (isAssistantAction(action.name)) appendAction(action.name, action.arg, result);
            // An action that could not run is news the user needs: they were
            // told it was happening.
            if (!result.ok) {
              set({ error: new UnknownFailure(DiagnosticMessage.assistant.actionFailed(result.error ?? CharConstants.empty)) });
            }
          }
          set({ status: AssistantStatus.Idle });
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
          view: AssistantView.Closed,
          level: ValueConstants.zero,
          isMuted: false,
        });
      },
    };
  });
};

/** Longer than a phrase is not a chip: it wraps, and the transcript stops
 *  being scannable at exactly the moment it has something to report. */
const MAX_DETAIL_CHARS = 40;
/** An argument carrying structure is a payload the model wrote for a handler,
 *  not a phrase written for a person. */
const STRUCTURED_DETAIL = /[{}[\]<>]/;

/**
 * The phrase an action chip shows beside its label, when there is one.
 *
 * What the handler NAMED wins over what the model asked for: "generate a
 * recipe with what is in the fridge" is the request, and the title of the
 * recipe that came back is the thing that now exists.
 */
function actionDetail(arg: string | undefined, result: AssistantActionResultType): string | undefined {
  const candidate = result.title ?? arg;
  if (candidate === undefined || candidate === CharConstants.empty) return undefined;
  if (candidate.length > MAX_DETAIL_CHARS || STRUCTURED_DETAIL.test(candidate)) return undefined;
  return candidate;
}

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
