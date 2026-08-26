import { DiagnosticMessage } from '@core/failure/diagnostic-message';
import { UnknownFailure } from '@core/failure/kinds/unknown-failure';
import { AssistantEventKind } from '@domain/assistant/session/assistant-event-kind';
import { AssistantGrantStatus } from '@domain/assistant/session/assistant-grant-status';
import { AssistantLevelMeter } from '@application/assistant/session/assistant-level-meter';
import { FailureCode } from '@core/failure/failure-code';
import { AssistantAction } from '@domain/assistant/actions/assistant-action-type';
import { assistantIsLive } from '@application/assistant/session/assistant-is-live';
import { AssistantDenialReason } from '@domain/assistant/session/assistant-denial-reason';
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
/**
 * How long a live session may hear nothing at all before it is torn down.
 *
 * This was 8 seconds, which is shorter than thinking about what to ask. The
 * Live API sends nothing while nobody speaks, so every natural pause — reading
 * a step, walking to the fridge, chopping — looked identical to a dead socket
 * and the session died silently, on the one screen designed for a user whose
 * hands are busy. Observed on an emulator: connect, then gone eight seconds
 * later with nothing said about it.
 *
 * It cannot be unlimited either: an open session bills against the daily
 * allowance through the heartbeat, so a forgotten one would drain it. Ninety
 * seconds is long enough for the pauses cooking actually has and short enough
 * that walking away does not cost the day's minutes.
 */
const SILENCE_TIMEOUT_MS = 90_000;
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
const MS_PER_SECOND = 1_000;
/**
 * How long the microphone stays shut after the assistant's last queued audio.
 *
 * The speaker keeps ringing briefly after the samples run out, and the room
 * keeps reflecting. Reopening the microphone exactly on the last sample let the
 * tail back in, which is the whole problem in miniature.
 */
const ECHO_TAIL_MS = 250;

/**
 * How long a spoken turn stays open with nothing arriving for it.
 *
 * One utterance's transcription arrives as a run of fragments; a gap this long
 * means the next thing said is a new one. Without it, two things said in a row
 * with no reply between them merged into a single bubble reading
 * "…ekrandakiEkrandaki ilk tarif" — the API marks no boundary within a turn,
 * so the pause is the only one there is.
 */
const UTTERANCE_GAP_MS = 1_200;

/**
 * How long a turn may sit with the model before the app admits nothing came.
 *
 * Reported with a screenshot: three things said in a row, the last of them
 * "can you hear me?", and not one answer — while the pill said "listening" and
 * the waveform sat flat, because between the end of an utterance and the first
 * sound of a reply this store changed no state at all. A model that IS
 * answering starts audio in a second or two, and one that decided to act sends
 * a tool call, which is its own status; neither is what this waits out.
 *
 * Generous on purpose: it must never fire on an answer that was merely slow,
 * only on one that is not coming.
 */
const ANSWER_TIMEOUT_MS = 12_000;

/** Swallows a rejection whose only useful response is to carry on regardless. */
const noop = (): void => undefined;

/**
 * A clock that only moves forwards.
 *
 * The echo gate compares against a future timestamp, so a backwards system
 * clock correction — NTP after a cold boot, a manual change — would leave the
 * microphone deaf for the size of the jump while the user talked into it.
 */
const now = (): number =>
  typeof performance !== 'undefined' && typeof performance.now === 'function'
    ? performance.now()
    : Date.now();

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
  /**
   * When the assistant's queued audio will have finished playing.
   *
   * Until then the microphone sends nothing. On a phone standing on a kitchen
   * counter the loudspeaker feeds straight back into it, and the model treated
   * its own sentence as the user's next instruction and answered it — out loud,
   * on repeat. The library offers no acoustic echo cancellation on Android (its
   * session options are iOS-only), so the only reliable cure is not to listen
   * while speaking. The cost is that a user cannot interrupt by voice mid-
   * answer; Mute and End still work, and a session that talks over itself is
   * not one they could interrupt anyway.
   */
  let speakingUntil = ValueConstants.zero;
  /**
   * The id of the line still being spoken into, or null between turns.
   *
   * An action chip landing mid-sentence, or the other party starting to speak,
   * closes it — so a turn only ever grows while it is genuinely the last thing
   * said.
   */
  let openTurn: string | null = null;
  let openTurnTimer: ReturnType<typeof setTimeout> | null = null;
  let answerTimer: ReturnType<typeof setTimeout> | null = null;
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
      // Output first, then input. Stopping the microphone hands the audio
      // session back to the system (`setAudioSessionActivity(false)`), and
      // doing that while an output context is still open and running leaves
      // the native layer holding a stream on a session it no longer owns — on
      // a platform that answers such things with a segfault rather than an
      // error.
      //
      // Each is wrapped alone because this is the one path that must always
      // finish: a rejection here used to skip `session.close()` and the final
      // `set`, leaving a socket open and billing, with its handler already
      // detached, under a screen still showing the old status. iOS raises
      // `AVAudioSessionErrorCodeIsBusy` for exactly this kind of teardown.
      await player.stop().catch(noop);
      await microphone.stop().catch(noop);
      session.close();
      // A waveform still moving under a session that has ended reads as a live
      // microphone, and a mute carried into the next session would silence it
      // before the user had said anything.
      meter.reset();
      speakingUntil = ValueConstants.zero;
      openTurn = null;
      if (openTurnTimer !== null) clearTimeout(openTurnTimer);
      openTurnTimer = null;
      stopAnswerTimer();
      set({ status, level: ValueConstants.zero, isMuted: false });
    };

    /**
     * Marks the turn as handed over, and bounds how long that may last.
     *
     * Only from `Listening`: audio or a tool call arriving inside the
     * utterance gap means the model has already started, and stepping back to
     * "thinking" over it would describe the session as less advanced than it
     * is.
     */
    const beginThinking = (): void => {
      if (get().status !== AssistantStatus.Listening) return;
      set({ status: AssistantStatus.Thinking });
      stopAnswerTimer();
      answerTimer = setTimeout(() => {
        if (get().status !== AssistantStatus.Thinking) return;
        // Back to listening, not torn down: the socket is fine and the user
        // can simply say it again. The notice is what turns "it ignored me"
        // into something they can act on.
        set({
          status: AssistantStatus.Listening,
          error: new UnknownFailure(DiagnosticMessage.assistant.noAnswer),
        });
      }, ANSWER_TIMEOUT_MS);
    };

    const stopAnswerTimer = (): void => {
      if (answerTimer !== null) clearTimeout(answerTimer);
      answerTimer = null;
    };

    const stopSilenceTimer = (): void => {
      if (silence !== null) clearTimeout(silence);
      silence = null;
    };

    const nudgeSilenceTimer = (): void => {
      stopSilenceTimer();
      silence = setTimeout(() => {
        // Say that it ended. Torn down in silence, the session simply was not
        // there any more and the screen offered no account of why.
        recordAction(AssistantAction.Stop);
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

    /**
     * Adds spoken text to the turn in progress, or starts one.
     *
     * Transcription STREAMS: the API sends a sentence a fragment at a time.
     * Appending each as its own line turned one answer into a column of
     * one-word bubbles — "Baklava" / "yapay" / "zeka" / "tarafından" — which
     * is most of why the conversation did not read as one. Fragments carry
     * their own spacing, so they are joined as they arrive rather than
     * re-spaced.
     */
    const closeTurnAfterGap = (speaker: ChatRole): void => {
      if (openTurnTimer !== null) clearTimeout(openTurnTimer);
      openTurnTimer = setTimeout(() => {
        openTurn = null;
        // The same pause that ends an utterance is the moment the turn becomes
        // the model's. Nothing else in the protocol marks it: there is no
        // "your turn" event, which is why this state did not exist before.
        if (speaker === ChatRole.User) beginThinking();
      }, UTTERANCE_GAP_MS);
    };

    const appendTranscript = (speaker: ChatRole, text: string): void => {
      closeTurnAfterGap(speaker);
      const transcript = get().transcript;
      const last = transcript[transcript.length - ValueConstants.one];

      if (
        openTurn !== null &&
        openTurn === last?.id &&
        last.kind === AssistantTranscriptLineKind.Speech &&
        last.speaker === speaker
      ) {
        const grown = { ...last, text: last.text + text };
        set({ transcript: [...transcript.slice(ValueConstants.zero, -ValueConstants.one), grown] });
        return;
      }

      const line = { kind: AssistantTranscriptLineKind.Speech, id: nextLineId(), speaker, text } as const;
      openTurn = line.id;
      set({ transcript: [...transcript, line] });
    };

    /**
     * Records that something was DONE, between the lines that were said.
     *
     * Only for an action that ran: one the user refused or that could not be
     * performed did not happen, and a chip claiming it did is worse than no
     * chip at all — they are watching the app to see whether it obeyed.
     */
    const recordAction = (action: AssistantActionType, detail?: string): void => {
      const line: AssistantTranscriptLine = {
        kind: AssistantTranscriptLineKind.Action,
        id: nextLineId(),
        action,
        detail,
      };
      set({ transcript: [...get().transcript, line] });
    };

    const appendAction = (
      action: AssistantActionType,
      arg: string | undefined,
      result: AssistantActionResultType,
    ): void => {
      if (!result.ok) return;
      recordAction(action, actionDetail(arg, result));
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

      set({ remainingSeconds: grant.value.remainingSeconds, isUnlimited: grant.value.isUnlimited });
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
      // Anything arriving at all is the answer to "did anything come back",
      // so the wait is over regardless of which event it was — and a notice
      // saying nothing came must not outlive the thing arriving.
      stopAnswerTimer();
      if (get().error !== null) set({ error: null });
      switch (event.kind) {
        case AssistantEventKind.Transcript:
          appendTranscript(event.speaker, event.text);
          nudgeSilenceTimer();
          break;
        case AssistantEventKind.Audio:
          set({ status: AssistantStatus.Speaking });
          // The microphone is deaf until this audio has finished playing, plus
          // a tail — see `speakingUntil`.
          speakingUntil =
            Math.max(speakingUntil, now()) +
            (event.samples.length / PLAYBACK_SAMPLE_RATE) * MS_PER_SECOND;
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
          // Nothing is queued any more, so the microphone reopens at once.
          speakingUntil = ValueConstants.zero;
          openTurn = null;
          silenceLevel();
          set({ status: AssistantStatus.Listening });
          break;
        case AssistantEventKind.TurnComplete:
          // A completed turn is a conversation that is happening, so the
          // handover counter starts again from here.
          openTurn = null;
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
      isUnlimited: false,
      tokensUsed: ValueConstants.zero,
      deniedReason: null,
      error: null,

      setView: (view) => set({ view }),

      toggleMute: () => {
        const isMuted = !get().isMuted;
        // The watchdog exists to notice a socket that has gone quiet on us. A
        // muted microphone sends nothing, so nothing comes back, and it fired
        // eight seconds after the user pressed a control offering to unmute —
        // the session was gone, along with the mute state itself. Silence the
        // user chose is not silence to recover from.
        if (isMuted) stopSilenceTimer();
        else nudgeSilenceTimer();
        // The waveform goes with the mute, in the same set: a bar still moving
        // over a muted microphone says audio is going out, which is the one
        // thing the control promises it is not.
        meter.reset();
        set({ isMuted, level: ValueConstants.zero });
      },

      startVoice: async (locale: string) => {
        // Not "is it idle": a refused or unreachable session leaves the status
        // at Unavailable, and refusing to start from there meant the button did
        // nothing at all on the first press after any failure.
        if (assistantIsLive(get().status)) return;
        set({ status: AssistantStatus.Connecting, error: null, deniedReason: null });

        languageCode = locale;
        resumptionHandle = null;
        expectingGoAway = false;
        handovers = ValueConstants.zero;
        // Bumped BEFORE the first await, and every await below is followed by
        // the same check. `Connecting` is a live status on purpose, so End is
        // on screen while this runs — and without the guard, ending a session
        // mid-connect tore down nothing and then this continued: socket open,
        // microphone on, heartbeat billing, a second after the user stopped it.
        epoch += ValueConstants.one;
        const startedAt = epoch;
        const abandoned = (): boolean => epoch !== startedAt;

        // Before the token, before the socket. Asked last, this was never
        // reached when anything earlier failed — so the user was never
        // prompted for the microphone and got "the request did not arrive"
        // for a session that had nothing to listen with.
        const access = await microphone.ensureAccess();
        if (abandoned()) return;
        if (!access.ok) {
          set({ status: AssistantStatus.Unavailable, deniedReason: AssistantDenialReason.MicrophoneDenied });
          return;
        }

        const grant = await tokens.mintSession(locale);
        if (abandoned()) return;
        if (!grant.ok) {
          set({ status: AssistantStatus.Unavailable, error: grant.failure });
          return;
        }
        if (grant.value.status === AssistantGrantStatus.Denied) {
          set({
            status: AssistantStatus.Unavailable,
            deniedReason: grant.value.reason,
            remainingSeconds: grant.value.remainingSeconds,
            isUnlimited: false,
          });
          return;
        }

        set({ remainingSeconds: grant.value.remainingSeconds, isUnlimited: grant.value.isUnlimited });

        // The order of the next four is not arrangement, it is the only one
        // that satisfies all three constraints at once:
        //   - the microphone first of the two devices, because starting it is
        //     what configures and activates the process-wide audio session,
        //     and building the output context under a session about to change
        //     leaves native audio holding a stream it no longer owns;
        //   - the player before the socket, so an opening greeting has
        //     somewhere to go instead of being dropped by its null guard while
        //     still gating the microphone for audio nobody heard;
        //   - the subscription before `connect`, because between a resolved
        //     connect and a later subscribe there is no listener at all, and
        //     whatever arrives in that window is gone rather than merely
        //     unplayable.
        // The cost is microphone frames captured before the socket is open,
        // which `send` drops on a socket that is not `OPEN` — and which nobody
        // is speaking into while the screen still says "Connecting".
        const input = await microphone.start(MIC_SAMPLE_RATE, (samples) => {
          // Muting withholds the frame itself. Anything softer — a flag the UI
          // reads, a gain of zero — still sends the room to the model, which
          // is what the user pressed the button to stop.
          if (get().isMuted) return;
          // And so does the assistant's own voice. The phone is on a counter
          // playing through its loudspeaker, and the library exposes no echo
          // cancellation on Android — its session options are iOS-only. So the
          // model heard itself, took it for the user, and answered, forever.
          // The zero check is not decoration: `now()` counts from process
          // start, so without it the gate closes over its own tail for the
          // first quarter-second of the app's life.
          if (speakingUntil !== ValueConstants.zero && now() < speakingUntil + ECHO_TAIL_MS) return;
          session.sendAudio(samples);
          if (get().status !== AssistantStatus.Speaking) publishLevel(samples);
        });
        if (abandoned()) {
          await microphone.stop().catch(noop);
          return;
        }
        if (!input.ok) {
          // A refusal is identified by WHAT it is, not by where it happened.
          // On native the prompt is in `ensureAccess`, so anything failing
          // here is something else — a busy recorder, a call in progress, an
          // OEM fault — and the diagnostic naming it is what tells them apart.
          // On the web there IS no way to ask ahead: the prompt is inside
          // `getUserMedia`, so the refusal lands here and nowhere else.
          // Deciding by position told a user who had just pressed Block to
          // retry a network problem.
          await teardown(AssistantStatus.Idle);
          if (input.failure.code === FailureCode.Forbidden) {
            set({ status: AssistantStatus.Unavailable, deniedReason: AssistantDenialReason.MicrophoneDenied });
            return;
          }
          set({ error: input.failure });
          return;
        }

        const output = await player.prepare(PLAYBACK_SAMPLE_RATE);
        if (abandoned()) {
          await player.stop().catch(noop);
          await microphone.stop().catch(noop);
          return;
        }
        if (!output.ok) {
          await teardown(AssistantStatus.Idle);
          set({ error: output.failure });
          return;
        }

        unsubscribe = session.subscribe(handle);

        const connected = await session.connect(grant.value.credentials);
        if (abandoned()) {
          // Detached first, exactly as teardown does. Harmless today — `handle`
          // is a stable reference and the only event that can follow is an
          // expected close — but the one abort that did not mirror teardown is
          // the one the next reader would not expect.
          unsubscribe?.();
          unsubscribe = null;
          session.close();
          await player.stop().catch(noop);
          await microphone.stop().catch(noop);
          return;
        }
        if (!connected.ok) {
          await teardown(AssistantStatus.Idle);
          set({ error: connected.failure });
          return;
        }

        heartbeat = setInterval(() => {
          void tokens.reportUsage(HEARTBEAT_SECONDS).then((reported) => {
            // `clearInterval` stops the next tick, not a report already in
            // flight. Unguarded, a late answer wrote minutes onto a session
            // that had ended — and a zero could tear down the NEXT one on the
            // previous one's budget.
            if (abandoned() || !reported.ok) return;
            set({
              remainingSeconds: reported.value.remainingSeconds,
              isUnlimited: reported.value.isUnlimited,
            });
            // An unmetered account has no zero to reach: the number beside the
            // flag is a floor the server sends so that builds predating the
            // flag keep working, and counting it down would end an admin's
            // session on a limit the server had already decided not to apply.
            if (reported.value.isUnlimited) return;
            if (reported.value.remainingSeconds <= ValueConstants.zero) {
              void teardown(AssistantStatus.Unavailable);
            }
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

          // An answer arriving IS the previous one having gone through. The
          // screen clears it on the way out too, but a notice that outlives the
          // failure it describes is the kind of thing a user reads as the app
          // still being broken.
          set({ error: null });

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
