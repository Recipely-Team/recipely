import { ForbiddenFailure } from '@core/failure/kinds/forbidden-failure';
import { AssistantDenialReason } from '@domain/assistant/session/assistant-denial-reason';
import { AssistantEventKind } from '@domain/assistant/session/assistant-event-kind';
import { AssistantGrantStatus } from '@domain/assistant/session/assistant-grant-status';
import { AssistantAction } from '@domain/assistant/actions/assistant-action-type';
import { AssistantActionRegistry } from '@application/assistant/actions/assistant-action-registry';
import { AssistantStatus } from '@application/assistant/session/assistant-status';
import { AssistantTranscriptLineKind } from '@application/assistant/session/assistant-transcript-line-kind';
import { AssistantView } from '@application/assistant/session/assistant-view';
import type { AssistantTranscriptLine } from '@application/assistant/session/assistant-transcript-line';
import { configureAssistantSessionStore } from '@application/assistant/session/assistant-session-store';
import type { AssistantSessionEventType } from '@domain/assistant/session/assistant-session-event';
import type { AssistantSessionInterface } from '@domain/assistant/session/assistant-session-interface';
import type { AssistantMessengerInterface } from '@domain/assistant/session/assistant-messenger-interface';
import type { AssistantTokenRepositoryInterface } from '@domain/assistant/session/assistant-token-repository-interface';
import type { AudioPlayerInterface } from '@domain/assistant/audio/audio-player-interface';
import { ChatRole } from '@domain/drafts/chat-role';
import type { MicrophoneInterface } from '@domain/assistant/audio/microphone-interface';
import { NetworkFailure } from '@core/failure';

const CREDENTIALS = { token: 't', model: 'm', wsUrl: 'wss://x', expiresAt: 'later' };

// Every harness is torn down after its test. A live session holds a heartbeat
// interval and a silence timeout, so a test that simply ended would leave both
// running — which is also the shape of the real bug they guard against.
const openStores: { getState: () => { stopVoice: () => Promise<void> } }[] = [];

function harness(
  overrides: {
    grantDenied?: boolean;
    /** Denies every mint after the first — the reconnect, not the start. */
    denyReconnect?: boolean;
    connectFails?: boolean;
    micFails?: boolean;
    micRefused?: boolean;
    /** Refuses at CAPTURE, the way a browser does — its prompt is inside getUserMedia. */
    micStartRefused?: boolean;
    messengerFails?: boolean;
    textAction?: { action: { name: string; arg?: string } };
    /** Holds one startup step open so a test can end the session inside it. */
    stall?: 'ensureAccess' | 'mint' | 'micStart' | 'prepare' | 'connect';
  } = {},
) {
  let emit: (event: AssistantSessionEventType) => void = () => {};
  /** Resolves the stalled step, once a test has done whatever it stalled it for. */
  let release: () => void = () => {};
  const stall = async (step: NonNullable<typeof overrides.stall>): Promise<void> => {
    if (overrides.stall !== step) return;
    await new Promise<void>((resolve) => {
      release = resolve;
    });
  };
  const calls = {
    flush: 0,
    enqueued: 0,
    micStopped: 0,
    /** The order the two audio devices were released in. */
    released: [] as string[],
    connects: 0,
    toolResponses: [] as unknown[],
    texts: [] as string[],
    mints: [] as { languageCode: string; resumptionHandle: string | undefined }[],
    audioFrames: 0,
    asks: [] as { message: string; languageCode: string; screenContext: string | undefined }[],
    onFrame: null as ((samples: Float32Array<ArrayBuffer>) => void) | null,
  };

  const session: AssistantSessionInterface = {
    connect: async () => {
      await stall('connect');
      calls.connects += 1;
      return overrides.connectFails === true
        ? { ok: false, failure: new NetworkFailure('nope') }
        : { ok: true, value: undefined };
    },
    sendAudio: () => {
      calls.audioFrames += 1;
    },
    sendText: (text) => calls.texts.push(text),
    respondToTool: (_id, response) => calls.toolResponses.push(response),
    subscribe: (listener) => {
      emit = listener;
      return () => {};
    },
    close: () => {},
  };

  const microphone: MicrophoneInterface = {
    ensureAccess: async () => (await stall('ensureAccess'),
      overrides.micRefused === true
        ? { ok: false, failure: new ForbiddenFailure('refused') }
        : { ok: true, value: undefined }),
    start: async (_rate, onFrame) => {
      await stall('micStart');
      if (overrides.micStartRefused === true) {
        return { ok: false, failure: new ForbiddenFailure('blocked') };
      }
      calls.onFrame = onFrame;
      return overrides.micFails === true
        ? { ok: false, failure: new NetworkFailure('denied') }
        : { ok: true, value: undefined };
    },
    stop: async () => {
      calls.micStopped += 1;
      calls.released.push('microphone');
      calls.onFrame = null;
    },
  };

  const player: AudioPlayerInterface = {
    prepare: async () => (await stall('prepare'), { ok: true, value: undefined }),
    enqueue: () => {
      calls.enqueued += 1;
    },
    flush: () => {
      calls.flush += 1;
    },
    stop: async () => {
      calls.released.push('player');
    },
  };

  const tokens: AssistantTokenRepositoryInterface = {
    mintSession: async (languageCode, resumptionHandle) => {
      await stall('mint');
      calls.mints.push({ languageCode, resumptionHandle });
      const denied =
        overrides.grantDenied === true ||
        (overrides.denyReconnect === true && calls.mints.length > 1);
      return denied
        ? {
            ok: true,
            value: {
              status: AssistantGrantStatus.Denied,
              reason: AssistantDenialReason.GlobalDailyLimit,
              remainingSeconds: 300,
            },
          }
        : {
            ok: true,
            value: {
              status: AssistantGrantStatus.Granted,
              credentials: CREDENTIALS,
              remainingSeconds: 480,
            },
          };
    },
    reportUsage: async () => ({ ok: true, value: 400 }),
  };

  const messenger: AssistantMessengerInterface = {
    ask: async (message, languageCode, screenContext) => {
      calls.asks.push({ message, languageCode, screenContext });
      return overrides.messengerFails === true
        ? { ok: false, failure: new NetworkFailure('offline') }
        : { ok: true, value: { reply: 'tamam', ...(overrides.textAction ?? {}) } };
    },
  };

  const registry = new AssistantActionRegistry();
  const store = configureAssistantSessionStore({ session, microphone, player, tokens, messenger, registry });
  openStores.push(store);
  return { store, registry, calls, emit: (event: AssistantSessionEventType) => emit(event), release: () => release() };
}

type SpeechLine = Extract<AssistantTranscriptLine, { kind: typeof AssistantTranscriptLineKind.Speech }>;

/** The lines that were SAID. An action line carries a key, not words. */
const spoken = (transcript: AssistantTranscriptLine[]): SpeechLine[] =>
  transcript.filter((line): line is SpeechLine => line.kind === AssistantTranscriptLineKind.Speech);

/** One capture frame, loud enough to move a waveform: RMS is `amplitude`. */
const frame = (amplitude: number): Float32Array<ArrayBuffer> =>
  new Float32Array([amplitude, amplitude, amplitude, amplitude]);

/** Lets every queued microtask — the tool queue, a reconnect — run to a stop. */
const settle = async (): Promise<void> => {
  for (let tick = 0; tick < 12; tick += 1) await Promise.resolve();
};

/** Lets every queued microtask run — teardown awaits two device stops, each
 *  behind its own rejection guard, so a fixed number of `Promise.resolve()`
 *  hops is a count that quietly goes stale. */
const settled = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 0));

describe('assistant session store', () => {
  afterEach(async () => {
    for (const store of openStores.splice(0)) await store.getState().stopVoice();
  });

  it('reaches listening once the socket, the player and the microphone are up', async () => {
    const { store } = harness();

    await store.getState().startVoice('tr-TR');

    expect(store.getState().status).toBe(AssistantStatus.Listening);
    expect(store.getState().remainingSeconds).toBe(480);
  });

  // Being out of budget is a normal answer, not an error: the screen offers the
  // text mode. A failure here would have shown an error dialog several times a
  // day for something working as designed.
  it('goes unavailable with a reason when the server denies, and sets no error', async () => {
    const { store } = harness({ grantDenied: true });

    await store.getState().startVoice('tr-TR');

    expect(store.getState().status).toBe(AssistantStatus.Unavailable);
    expect(store.getState().deniedReason).toBe(AssistantDenialReason.GlobalDailyLimit);
    expect(store.getState().error).toBeNull();
  });

  // Voice is billed per second of an open microphone, so a half-started session
  // that left the mic running is the most expensive bug this feature can have.
  it('closes the microphone when the socket will not connect', async () => {
    const { store, calls } = harness({ connectFails: true });

    await store.getState().startVoice('tr-TR');

    expect(store.getState().status).toBe(AssistantStatus.Idle);
    expect(calls.micStopped).toBeGreaterThan(0);
  });

  describe('the microphone', () => {
    // The user reported never being asked for the microphone at all. It was
    // requested LAST — after the token was minted and the socket was open — so
    // anything failing earlier meant the prompt was never reached, and the
    // screen said "this request did not arrive" for a session that had nothing
    // to listen with.
    it('is asked for before a token is spent on the session', async () => {
      const { store, calls } = harness({ micRefused: true });

      await store.getState().startVoice('tr-TR');

      expect(calls.mints).toHaveLength(0);
    });

    // "The request did not arrive" invites a retry of the thing that will keep
    // refusing. A refusal the user can act on has to say so.
    it('reports a refusal as a reason, not as a failed request', async () => {
      const { store } = harness({ micRefused: true });

      await store.getState().startVoice('tr-TR');

      expect(store.getState().status).toBe(AssistantStatus.Unavailable);
      expect(store.getState().deniedReason).toBe(AssistantDenialReason.MicrophoneDenied);
      expect(store.getState().error).toBeNull();
    });

    // Both halves of the web path were covered and the SEAM between them was
    // not — which is exactly where the defect lived: the store decided a
    // refusal by where it happened, and on the web the prompt is inside
    // `getUserMedia`, so the refusal lands where the code assumed it could not.
    it('recognises a refusal that arrives at capture, as the browser delivers it', async () => {
      const { store } = harness({ micStartRefused: true });

      await store.getState().startVoice('tr-TR');

      expect(store.getState().deniedReason).toBe(AssistantDenialReason.MicrophoneDenied);
      expect(store.getState().error).toBeNull();
    });

    // A refusal is `ensureAccess`'s answer. Failing at CAPTURE means something
    // else — the recorder busy, a call in progress, an OEM fault — and only the
    // diagnostic naming it can tell them apart. Reported as a denied
    // permission, it sent the user to grant one they had already granted.
    it('does not blame the permission when capture fails for another reason', async () => {
      const { store } = harness({ micFails: true });

      await store.getState().startVoice('tr-TR');

      expect(store.getState().deniedReason).toBeNull();
      expect(store.getState().error).not.toBeNull();
    });
  });

  // The first press after any failure called STOP, because the status was
  // Unavailable rather than Idle and both the hook and the store asked "is it
  // idle". Seen on an emulator: the button did nothing until pressed twice.
  it('starts on the first press after a session failed to begin', async () => {
    const { store, calls } = harness({ grantDenied: true });
    await store.getState().startVoice('tr-TR');
    expect(store.getState().status).toBe(AssistantStatus.Unavailable);

    await store.getState().startVoice('tr-TR');

    expect(calls.mints).toHaveLength(2);
  });

  // Stopping the microphone hands the audio session back to the system, and
  // doing that while an output context is still open leaves the native layer
  // holding a stream on a session it no longer owns. A Xiaomi answered the
  // audio path with a segfault rather than an error, so the ordering here is
  // not a matter of taste.
  it('releases the output before handing the audio session back', async () => {
    const { store, calls } = harness();
    await store.getState().startVoice('tr-TR');

    await store.getState().stopVoice();

    expect(calls.released).toEqual(['player', 'microphone']);
  });

  // `Connecting` is a live status on purpose, so End is on screen while the
  // session is still being established. Without an epoch check after each
  // await, ending it there tore down nothing and `startVoice` then carried on:
  // socket open, microphone on, heartbeat billing — a second after the user
  // stopped it, with no control left that had any effect.
  it('opens nothing when the session is ended while it is still connecting', async () => {
    const { store, calls } = harness();
    const starting = store.getState().startVoice('tr-TR');
    await store.getState().stopVoice();

    await starting;

    expect(store.getState().status).toBe(AssistantStatus.Idle);
    expect(calls.onFrame).toBeNull();
  });

  // The subscription used to be taken last, which left a window between a
  // resolved connect and it where an arriving greeting had no listener at all
  // — gone rather than merely unplayable.
  it('is listening before the socket can say anything', async () => {
    const { store, calls, emit } = harness();

    await store.getState().startVoice('tr-TR');
    emit({ kind: AssistantEventKind.Audio, samples: new Float32Array([0.2]) });

    expect(calls.enqueued).toBeGreaterThan(0);
  });

  // `Connecting` is a live status on purpose, so End is on screen for the whole
  // of `startVoice` — which awaits five things. Without a check after each,
  // ending it there tore down nothing and the function carried on: socket open,
  // microphone on, heartbeat billing, a second after the user stopped it.
  //
  // Each step is held open in turn so the abort at THAT point actually runs.
  // Only the first was reachable before, and the four that contain the cleanup
  // code never executed in any test.
  describe.each([
    ['asking for the microphone', 'ensureAccess'],
    ['minting the session', 'mint'],
    ['opening the microphone', 'micStart'],
    ['preparing playback', 'prepare'],
    ['connecting the socket', 'connect'],
  ] as const)('ended while %s', (_name, step) => {
    it('leaves nothing open and nothing listening', async () => {
      const { store, calls, release } = harness({ stall: step });
      const starting = store.getState().startVoice('tr-TR');
      await settled();

      await store.getState().stopVoice();
      release();
      await starting;
      await settled();

      expect(store.getState().status).toBe(AssistantStatus.Idle);
      // The device is the thing that matters: a live callback here means a
      // microphone still recording for a session the user ended.
      expect(calls.onFrame).toBeNull();
      // Released output-first, the mirror of teardown. Releasing twice is
      // harmless — both stops are idempotent — but out of order is not.
      const tail = calls.released.slice(-2);
      if (tail.length === 2 && tail[0] !== tail[1]) expect(tail).toEqual(['player', 'microphone']);
    });
  });

  it('ignores a second start while a session is already up', async () => {
    const { store } = harness();
    await store.getState().startVoice('tr-TR');

    await store.getState().startVoice('tr-TR');

    expect(store.getState().status).toBe(AssistantStatus.Listening);
  });

  describe('while a session runs', () => {
    it('queues model audio and shows it as speaking', async () => {
      const { store, calls, emit } = harness();
      await store.getState().startVoice('tr-TR');

      emit({ kind: AssistantEventKind.Audio, samples: new Float32Array([0.1]) });

      expect(calls.enqueued).toBe(1);
      expect(store.getState().status).toBe(AssistantStatus.Speaking);
    });

    // Dropping the queued audio IS the interruption. Anything gentler leaves
    // the assistant finishing the sentence the user just talked over.
    it('flushes the queue the moment an interruption arrives', async () => {
      const { store, calls, emit } = harness();
      await store.getState().startVoice('tr-TR');
      emit({ kind: AssistantEventKind.Audio, samples: new Float32Array([0.1]) });

      emit({ kind: AssistantEventKind.Interrupted });

      expect(calls.flush).toBe(1);
      expect(store.getState().status).toBe(AssistantStatus.Listening);
    });

    it('records both sides of the transcript', async () => {
      const { store, emit } = harness();
      await store.getState().startVoice('tr-TR');

      emit({ kind: AssistantEventKind.Transcript, speaker: ChatRole.User, text: 'tavuk var' });
      emit({ kind: AssistantEventKind.Transcript, speaker: ChatRole.Assistant, text: 'tamam' });

      expect(spoken(store.getState().transcript).map((l) => [l.speaker, l.text])).toEqual([
        [ChatRole.User, 'tavuk var'],
        [ChatRole.Assistant, 'tamam'],
      ]);
    });

    // A session that never answers a tool call simply stops, with no error
    // anywhere — so every call is answered, including ones nothing can perform.
    it('answers a tool call the registry cannot perform', async () => {
      const { store, calls, emit } = harness();
      await store.getState().startVoice('tr-TR');

      emit({ kind: AssistantEventKind.ToolCall, callId: 'c1', action: AssistantAction.AttachPhoto });
      // The queue that serialises tool calls costs a tick beyond the handler's.
      for (let tick = 0; tick < 8; tick += 1) await Promise.resolve();

      expect(calls.toolResponses).toEqual([{ ok: false, error: 'unavailable_here' }]);
    });

    it('runs a registered action and answers with its result', async () => {
      const { store, registry, calls, emit } = harness();
      registry.register(AssistantAction.GenerateRecipe, async (arg) => ({ ok: true, title: arg }));
      await store.getState().startVoice('tr-TR');

      emit({ kind: AssistantEventKind.ToolCall, callId: 'c1', action: AssistantAction.GenerateRecipe, arg: 'tavuk' });
      for (let tick = 0; tick < 8; tick += 1) await Promise.resolve();

      expect(calls.toolResponses).toEqual([{ ok: true, title: 'tavuk' }]);
    });

    // The model sends several calls in one frame when the user asks for several
    // things, and each is meant to see what the last one did — "open the recipe
    // and share it" is nonsense if the share runs against the screen the open
    // was still pushing. Concurrently, these two interleaved.
    it('runs several calls from one frame in order, never overlapping', async () => {
      const { store, registry, calls, emit } = harness();
      const order: string[] = [];
      let running = false;
      const slow = (label: string) => async (): Promise<{ ok: true }> => {
        expect(running).toBe(false);
        running = true;
        order.push(`${label}:start`);
        await Promise.resolve();
        await Promise.resolve();
        order.push(`${label}:end`);
        running = false;
        return { ok: true };
      };
      registry.register(AssistantAction.OpenRecipe, slow('open'));
      registry.register(AssistantAction.Save, slow('save'));
      await store.getState().startVoice('tr-TR');

      emit({ kind: AssistantEventKind.ToolCall, callId: 'c1', action: AssistantAction.OpenRecipe });
      emit({ kind: AssistantEventKind.ToolCall, callId: 'c2', action: AssistantAction.Save });
      await settle();

      expect(order).toEqual(['open:start', 'open:end', 'save:start', 'save:end']);
      expect(calls.toolResponses).toHaveLength(2);
    });

    // A queue holding a rejected promise would swallow every later call in
    // silence, which is the same symptom as a session that has stopped.
    it('keeps running the queue after a handler rejects', async () => {
      const { store, registry, calls, emit } = harness();
      registry.register(AssistantAction.OpenRecipe, async () => {
        throw new Error('boom');
      });
      registry.register(AssistantAction.Save, async () => ({ ok: true, title: 'after' }));
      await store.getState().startVoice('tr-TR');

      emit({ kind: AssistantEventKind.ToolCall, callId: 'c1', action: AssistantAction.OpenRecipe });
      emit({ kind: AssistantEventKind.ToolCall, callId: 'c2', action: AssistantAction.Save });
      await settle();

      expect(calls.toolResponses).toEqual([
        { ok: false, error: 'failed' },
        { ok: true, title: 'after' },
      ]);
    });

    // The server drops the socket roughly every ten minutes BY DESIGN. A
    // session that read that as the end would die mid-conversation on a timer,
    // which is what happened while these events fell through to `default`.
    describe('surviving a goAway', () => {
      it('continues on a fresh socket instead of ending', async () => {
        const { store, calls, emit } = harness();
        await store.getState().startVoice('tr-TR');
        calls.connects = 0;

        emit({ kind: AssistantEventKind.Resumption, handle: 'h-1' });
        emit({ kind: AssistantEventKind.GoAway, timeLeftMs: 9500 });
        emit({ kind: AssistantEventKind.Closed, expected: false });
        await settle();

        expect(calls.connects).toBe(1);
        expect(store.getState().status).not.toBe(AssistantStatus.Idle);
      });

      // Without the handle the new session would pay for setup and the whole
      // conversation's context again — the reason the handle exists.
      it('mints the new token with the handle and the original language', async () => {
        const { store, calls, emit } = harness();
        await store.getState().startVoice('tr-TR');
        calls.mints.length = 0;

        emit({ kind: AssistantEventKind.Resumption, handle: 'h-7' });
        emit({ kind: AssistantEventKind.GoAway, timeLeftMs: 9500 });
        emit({ kind: AssistantEventKind.Closed, expected: false });
        await settle();

        expect(calls.mints).toEqual([{ languageCode: 'tr-TR', resumptionHandle: 'h-7' }]);
      });

      // The microphone and the player stay up: only the transport is replaced,
      // so the user hears a pause rather than a session ending.
      it('leaves the microphone open across the gap', async () => {
        const { store, calls, emit } = harness();
        await store.getState().startVoice('tr-TR');
        calls.micStopped = 0;

        emit({ kind: AssistantEventKind.Resumption, handle: 'h-1' });
        emit({ kind: AssistantEventKind.GoAway, timeLeftMs: 9500 });
        emit({ kind: AssistantEventKind.Closed, expected: false });
        await settle();

        expect(calls.micStopped).toBe(0);
      });

      // A drop with no goAway before it is a real failure, not a scheduled
      // handover — reconnecting into one would retry a broken connection.
      it('does not reconnect a socket that simply died', async () => {
        const { store, calls, emit } = harness();
        await store.getState().startVoice('tr-TR');
        calls.connects = 0;

        emit({ kind: AssistantEventKind.Resumption, handle: 'h-1' });
        emit({ kind: AssistantEventKind.Closed, expected: false });
        await settle();

        expect(calls.connects).toBe(0);
        expect(store.getState().status).toBe(AssistantStatus.Idle);
      });

      // The reconnect is where the daily budget is re-checked, so a user who
      // has run out mid-conversation stops there rather than continuing free.
      it('ends the session when the budget is gone at the handover', async () => {
        const { store, calls, emit } = harness({ denyReconnect: true });
        await store.getState().startVoice('tr-TR');
        calls.micStopped = 0;

        emit({ kind: AssistantEventKind.Resumption, handle: 'h-1' });
        emit({ kind: AssistantEventKind.GoAway, timeLeftMs: 9500 });
        emit({ kind: AssistantEventKind.Closed, expected: false });
        await settle();

        expect(store.getState().status).toBe(AssistantStatus.Idle);
        expect(calls.micStopped).toBeGreaterThan(0);
      });
    });

      // Only the TRANSPORT is replaced. The capture callback closes over the
      // session object, not its socket, so audio must keep flowing after the
      // handover — a mic still pushing at a socket that no longer exists is
      // the same silence as a mic that was closed.
      it('keeps the microphone feeding the new socket', async () => {
        const { store, calls, emit } = harness();
        await store.getState().startVoice('tr-TR');

        emit({ kind: AssistantEventKind.Resumption, handle: 'h-1' });
        emit({ kind: AssistantEventKind.GoAway, timeLeftMs: 9500 });
        emit({ kind: AssistantEventKind.Closed, expected: false });
        await settle();
        calls.audioFrames = 0;
        calls.onFrame?.(new Float32Array([0.2]));

        expect(calls.audioFrames).toBe(1);
      });

      // A goAway is normal every ten minutes, so several per session is fine —
      // but several with no completed turn between them means the handover
      // itself is failing, and retrying forever bills the backend for a
      // session nobody is having.
      it('gives up after repeated handovers with no conversation between them', async () => {
        const { store, calls, emit } = harness();
        await store.getState().startVoice('tr-TR');
        calls.connects = 0;

        for (let round = 0; round < 5; round += 1) {
          emit({ kind: AssistantEventKind.Resumption, handle: 'h-1' });
          emit({ kind: AssistantEventKind.GoAway, timeLeftMs: 9500 });
          emit({ kind: AssistantEventKind.Closed, expected: false });
          await settle();
        }

        expect(calls.connects).toBeLessThanOrEqual(3);
        expect(store.getState().status).toBe(AssistantStatus.Idle);
      });

      it('keeps handing over across a long conversation', async () => {
        const { store, calls, emit } = harness();
        await store.getState().startVoice('tr-TR');
        calls.connects = 0;

        for (let round = 0; round < 5; round += 1) {
          emit({ kind: AssistantEventKind.Resumption, handle: 'h-1' });
          emit({ kind: AssistantEventKind.GoAway, timeLeftMs: 9500 });
          emit({ kind: AssistantEventKind.Closed, expected: false });
          await settle();
          // A completed turn is a conversation that is happening.
          emit({ kind: AssistantEventKind.TurnComplete });
        }

        expect(calls.connects).toBe(5);
        expect(store.getState().status).not.toBe(AssistantStatus.Idle);
      });

      // The turn the pill was showing died with the socket, so it must not be
      // left reading "speaking" until something else happens to arrive.
      it('goes back to listening after the handover', async () => {
        const { store, emit } = harness();
        await store.getState().startVoice('tr-TR');
        emit({ kind: AssistantEventKind.Audio, samples: new Float32Array([0.1]) });

        emit({ kind: AssistantEventKind.Resumption, handle: 'h-1' });
        emit({ kind: AssistantEventKind.GoAway, timeLeftMs: 9500 });
        emit({ kind: AssistantEventKind.Closed, expected: false });
        await settle();

        expect(store.getState().status).toBe(AssistantStatus.Listening);
      });

      // Saying "stop" during the handover used to open a fresh socket AFTER
      // the microphone had been closed: a session nobody could hear, and one
      // the pill showed as idle so nobody could end it either.
      it('does not open a socket for a session the user already stopped', async () => {
        const { store, calls, emit } = harness();
        await store.getState().startVoice('tr-TR');
        calls.connects = 0;

        emit({ kind: AssistantEventKind.Resumption, handle: 'h-1' });
        emit({ kind: AssistantEventKind.GoAway, timeLeftMs: 9500 });
        emit({ kind: AssistantEventKind.Closed, expected: false });
        await store.getState().stopVoice();
        await settle();

        expect(calls.connects).toBe(0);
        expect(store.getState().status).toBe(AssistantStatus.Idle);
      });

    it('records what the session has cost so far', async () => {
      const { store, emit } = harness();
      await store.getState().startVoice('tr-TR');

      emit({ kind: AssistantEventKind.Usage, totalTokens: 957 });

      expect(store.getState().tokensUsed).toBe(957);
    });

    it('stands down when the socket closes', async () => {
      const { store, emit } = harness();
      await store.getState().startVoice('tr-TR');

      emit({ kind: AssistantEventKind.Closed, expected: false });
      await settled();

      expect(store.getState().status).toBe(AssistantStatus.Idle);
    });
  });

  it('closes the microphone on stop', async () => {
    const { store, calls } = harness();
    await store.getState().startVoice('tr-TR');

    await store.getState().stopVoice();

    expect(store.getState().status).toBe(AssistantStatus.Idle);
    expect(calls.micStopped).toBeGreaterThan(0);
  });

  describe('the level a waveform is drawn from', () => {
    it('rises with what the microphone hears', async () => {
      const { store, calls } = harness();
      await store.getState().startVoice('tr-TR');

      calls.onFrame?.(frame(0.25));

      expect(store.getState().level).toBeGreaterThan(0);
    });

    // While the model talks the microphone is still open, so a bar driven by
    // the room would move to whatever is happening in it rather than to the
    // voice the user is listening to.
    it('follows the model while it is speaking', async () => {
      const { store, emit } = harness();
      await store.getState().startVoice('tr-TR');

      emit({ kind: AssistantEventKind.Audio, samples: frame(0.25) });

      expect(store.getState().level).toBeGreaterThan(0);
    });

    // A bar left at half height after hanging up reads as a live microphone.
    it('falls to zero when the session stops', async () => {
      const { store, calls } = harness();
      await store.getState().startVoice('tr-TR');
      calls.onFrame?.(frame(0.25));
      expect(store.getState().level).toBeGreaterThan(0);

      await store.getState().stopVoice();

      expect(store.getState().level).toBe(0);
    });

    // Capture frames arrive dozens of times a second and every published value
    // re-renders each subscriber: a panel repainted at the frame rate is a
    // defect, not a waveform. Loudness alternates on purpose, so what holds the
    // updates back is the interval rather than an unchanged reading.
    it('publishes at a screen rate rather than once per frame', async () => {
      jest.useFakeTimers();
      try {
        const { store, calls } = harness();
        await store.getState().startVoice('tr-TR');
        let published = 0;
        const stopWatching = store.subscribe(() => {
          published += 1;
        });

        for (let at = 0; at < 20; at += 1) calls.onFrame?.(frame(at % 2 === 0 ? 0.05 : 0.25));
        const withinOneInterval = published;
        jest.advanceTimersByTime(100);
        calls.onFrame?.(frame(0.25));
        stopWatching();

        expect(withinOneInterval).toBe(1);
        expect(published).toBe(2);
      } finally {
        jest.useRealTimers();
      }
    });
  });

  describe('muting', () => {
    // A mute that only labels itself still sends the room to the model, which
    // is the one thing the button promises it does not.
    it('keeps captured frames off the socket', async () => {
      const { store, calls } = harness();
      await store.getState().startVoice('tr-TR');
      store.getState().toggleMute();
      calls.audioFrames = 0;

      calls.onFrame?.(frame(0.3));

      expect(store.getState().isMuted).toBe(true);
      expect(calls.audioFrames).toBe(0);
    });

    it('silences the waveform along with the microphone', async () => {
      const { store, calls } = harness();
      await store.getState().startVoice('tr-TR');
      calls.onFrame?.(frame(0.3));
      expect(store.getState().level).toBeGreaterThan(0);

      store.getState().toggleMute();
      calls.onFrame?.(frame(0.3));

      expect(store.getState().level).toBe(0);
    });

    it('sends again once it is switched off', async () => {
      const { store, calls } = harness();
      await store.getState().startVoice('tr-TR');
      store.getState().toggleMute();

      store.getState().toggleMute();
      calls.audioFrames = 0;
      calls.onFrame?.(frame(0.3));

      expect(store.getState().isMuted).toBe(false);
      expect(calls.audioFrames).toBe(1);
    });

    // The watchdog exists to notice a socket that has gone quiet on US. A muted
    // microphone sends nothing, so nothing comes back, so it fired eight
    // seconds after the user pressed a control that offered to unmute — the
    // session was gone, and with it the mute state, with no notice either way.
    it('does not let the silence watchdog end a session the user muted', async () => {
      jest.useFakeTimers();
      try {
        const { store } = harness();
        await store.getState().startVoice('tr-TR');
        store.getState().toggleMute();

        await jest.advanceTimersByTimeAsync(30_000);

        expect(store.getState().status).not.toBe(AssistantStatus.Idle);
        expect(store.getState().isMuted).toBe(true);
      } finally {
        jest.useRealTimers();
      }
    });

    it('starts watching again as soon as the microphone comes back', async () => {
      jest.useFakeTimers();
      try {
        const { store } = harness();
        await store.getState().startVoice('tr-TR');
        store.getState().toggleMute();
        store.getState().toggleMute();

        await jest.advanceTimersByTimeAsync(120_000);

        expect(store.getState().status).toBe(AssistantStatus.Idle);
      } finally {
        jest.useRealTimers();
      }
    });

    // A mute carried into the next session would silence it before the user
    // had said anything, with a control they had already switched off.
    it('is forgotten when the session ends', async () => {
      const { store } = harness();
      await store.getState().startVoice('tr-TR');
      store.getState().toggleMute();

      await store.getState().stopVoice();

      expect(store.getState().isMuted).toBe(false);
    });
  });

  describe('how a spoken turn reads', () => {
    // Transcription streams. Each fragment became its own line, so one answer
    // arrived as a column of one-word bubbles — "Baklava" / "yapay" / "zeka" /
    // "tarafından" — which is most of why the conversation did not read as one.
    it('grows one bubble as the sentence arrives', async () => {
      const { store, emit } = harness();
      await store.getState().startVoice('tr-TR');

      emit({ kind: AssistantEventKind.Transcript, speaker: ChatRole.Assistant, text: 'Baklava' });
      emit({ kind: AssistantEventKind.Transcript, speaker: ChatRole.Assistant, text: ' yapay zeka' });
      emit({ kind: AssistantEventKind.Transcript, speaker: ChatRole.Assistant, text: ' hazırlıyor.' });

      expect(store.getState().transcript).toEqual([
        expect.objectContaining({ speaker: ChatRole.Assistant, text: 'Baklava yapay zeka hazırlıyor.' }),
      ]);
    });

    // Two things said in a row with no reply between them merged into one
    // bubble reading "…ekrandakiEkrandaki ilk tarif". The API marks no boundary
    // within a turn, so the pause between utterances is the only one there is.
    it('starts a new bubble for the next thing said after a pause', async () => {
      jest.useFakeTimers();
      try {
        const { store, emit } = harness();
        await store.getState().startVoice('tr-TR');

        emit({ kind: AssistantEventKind.Transcript, speaker: ChatRole.User, text: 'ekrandaki' });
        await jest.advanceTimersByTimeAsync(3_000);
        emit({ kind: AssistantEventKind.Transcript, speaker: ChatRole.User, text: 'ilk tarif' });

        expect(store.getState().transcript).toHaveLength(2);
      } finally {
        jest.useRealTimers();
      }
    });

    it('keeps one bubble while the fragments keep arriving', async () => {
      jest.useFakeTimers();
      try {
        const { store, emit } = harness();
        await store.getState().startVoice('tr-TR');

        emit({ kind: AssistantEventKind.Transcript, speaker: ChatRole.User, text: 'baklava' });
        await jest.advanceTimersByTimeAsync(200);
        emit({ kind: AssistantEventKind.Transcript, speaker: ChatRole.User, text: ' tarifi' });

        expect(store.getState().transcript).toHaveLength(1);
      } finally {
        jest.useRealTimers();
      }
    });

    it('starts a new bubble when the other party speaks', async () => {
      const { store, emit } = harness();
      await store.getState().startVoice('tr-TR');

      emit({ kind: AssistantEventKind.Transcript, speaker: ChatRole.User, text: 'baklava' });
      emit({ kind: AssistantEventKind.Transcript, speaker: ChatRole.Assistant, text: 'tamam' });

      expect(store.getState().transcript).toHaveLength(2);
    });

    it('starts a new bubble for the next turn', async () => {
      const { store, emit } = harness();
      await store.getState().startVoice('tr-TR');

      emit({ kind: AssistantEventKind.Transcript, speaker: ChatRole.Assistant, text: 'tamam' });
      emit({ kind: AssistantEventKind.TurnComplete });
      emit({ kind: AssistantEventKind.Transcript, speaker: ChatRole.Assistant, text: 'peki' });

      expect(store.getState().transcript).toHaveLength(2);
    });
  });

  describe('the assistant hearing itself', () => {
    // Reported from a phone: "it hears what it says and takes it as a command,
    // and talks one after another." The loudspeaker feeds back into the
    // microphone, and the library exposes no echo cancellation on Android — its
    // session options are iOS-only. So the model answered its own sentence,
    // forever.
    it('sends nothing while its own audio is playing', async () => {
      jest.useFakeTimers();
      try {
        const { store, calls, emit } = harness();
        await store.getState().startVoice('tr-TR');
        // One second of playback at 24 kHz.
        emit({ kind: AssistantEventKind.Audio, samples: new Float32Array(24_000) });
        calls.audioFrames = 0;

        calls.onFrame?.(frame(0.3));

        expect(calls.audioFrames).toBe(0);
      } finally {
        jest.useRealTimers();
      }
    });

    it('listens again once the audio has finished', async () => {
      jest.useFakeTimers();
      try {
        const { store, calls, emit } = harness();
        await store.getState().startVoice('tr-TR');
        emit({ kind: AssistantEventKind.Audio, samples: new Float32Array(24_000) });
        calls.audioFrames = 0;

        // A second of audio, plus the tail the room takes to go quiet.
        await jest.advanceTimersByTimeAsync(1_500);
        calls.onFrame?.(frame(0.3));

        expect(calls.audioFrames).toBe(1);
      } finally {
        jest.useRealTimers();
      }
    });

    // Talking over it drops the queue, so there is nothing left to echo.
    it('reopens the microphone the moment it is interrupted', async () => {
      const { store, calls, emit } = harness();
      await store.getState().startVoice('tr-TR');
      emit({ kind: AssistantEventKind.Audio, samples: new Float32Array(24_000) });
      emit({ kind: AssistantEventKind.Interrupted });
      calls.audioFrames = 0;

      calls.onFrame?.(frame(0.3));

      expect(calls.audioFrames).toBe(1);
    });
  });

  describe('a session that hears nothing', () => {
    // Observed on an emulator: the session connected and was gone eight
    // seconds later, silently. The Live API sends nothing while nobody speaks,
    // so every pause cooking actually has — reading a step, walking to the
    // fridge — was indistinguishable from a dead socket.
    it('survives a pause long enough to think about what to ask', async () => {
      jest.useFakeTimers();
      try {
        const { store } = harness();
        await store.getState().startVoice('tr-TR');

        await jest.advanceTimersByTimeAsync(30_000);

        expect(store.getState().status).not.toBe(AssistantStatus.Idle);
      } finally {
        jest.useRealTimers();
      }
    });

    it('gives up eventually, and says so rather than vanishing', async () => {
      jest.useFakeTimers();
      try {
        const { store } = harness();
        await store.getState().startVoice('tr-TR');

        await jest.advanceTimersByTimeAsync(120_000);

        expect(store.getState().status).toBe(AssistantStatus.Idle);
        expect(store.getState().transcript.at(-1)).toMatchObject({ action: AssistantAction.Stop });
      } finally {
        jest.useRealTimers();
      }
    });
  });

  describe('what the transcript records about actions', () => {
    it('records an action that ran, with the phrase it ran on', async () => {
      const { store, registry, emit } = harness();
      registry.register(AssistantAction.Search, async () => ({ ok: true }));
      await store.getState().startVoice('tr-TR');

      emit({ kind: AssistantEventKind.ToolCall, callId: 'c1', action: AssistantAction.Search, arg: 'mercimek' });
      await settle();

      expect(store.getState().transcript.at(-1)).toEqual({
        kind: AssistantTranscriptLineKind.Action,
        id: expect.any(String),
        action: AssistantAction.Search,
        detail: 'mercimek',
      });
    });

    // A chip saying the app opened a recipe it could not open is worse than no
    // chip: the transcript is what the user reads to see whether it obeyed.
    it('records nothing for a call nothing could perform', async () => {
      const { store, emit } = harness();
      await store.getState().startVoice('tr-TR');

      emit({ kind: AssistantEventKind.ToolCall, callId: 'c1', action: AssistantAction.AttachPhoto });
      await settle();

      expect(store.getState().transcript).toEqual([]);
    });

    // What the handler named beats what the model asked for: the request was
    // "something with what is in the fridge", the recipe is what now exists.
    it('prefers the title the handler reported over the argument', async () => {
      const { store, registry, emit } = harness();
      registry.register(AssistantAction.GenerateRecipe, async () => ({ ok: true, title: 'Mercimek çorbası' }));
      await store.getState().startVoice('tr-TR');

      emit({
        kind: AssistantEventKind.ToolCall,
        callId: 'c1',
        action: AssistantAction.GenerateRecipe,
        arg: 'buzdolabındakilerle bir şeyler',
      });
      await settle();

      expect(store.getState().transcript.at(-1)).toMatchObject({ detail: 'Mercimek çorbası' });
    });

    // An argument carrying structure is a payload the model wrote for a
    // handler, and a chip is one short line.
    it('leaves a payload argument off the line', async () => {
      const { store, registry, emit } = harness();
      registry.register(AssistantAction.SetDraftField, async () => ({ ok: true }));
      await store.getState().startVoice('tr-TR');

      emit({
        kind: AssistantEventKind.ToolCall,
        callId: 'c1',
        action: AssistantAction.SetDraftField,
        arg: '{"field":"title","value":"x"}',
      });
      await settle();

      expect(store.getState().transcript.at(-1)).toEqual({
        kind: AssistantTranscriptLineKind.Action,
        id: expect.any(String),
        action: AssistantAction.SetDraftField,
      });
    });
  });

  describe('how much of the assistant is showing', () => {
    it('starts closed and moves to the view it is given', () => {
      const { store } = harness();
      expect(store.getState().view).toBe(AssistantView.Closed);

      store.getState().setView(AssistantView.Mini);

      expect(store.getState().view).toBe(AssistantView.Mini);
    });

    it('closes again on reset', async () => {
      const { store } = harness();
      store.getState().setView(AssistantView.Open);

      store.getState().reset();
      await settle();

      expect(store.getState().view).toBe(AssistantView.Closed);
    });
  });

  // The mode the whole budget design promises. Out of budget there is no
  // socket, and this used to write the user's message into the transcript and
  // drop it — which looked exactly like being ignored.
  describe('typing with no session', () => {
    it('answers over HTTP and shows the reply', async () => {
      const { store, calls } = harness({ grantDenied: true });
      await store.getState().startVoice('tr-TR');

      store.getState().sendText('tavuklu bir şey öner', 'tr-TR');
      await settle();

      expect(calls.asks).toEqual([
        { message: 'tavuklu bir şey öner', languageCode: 'tr-TR', screenContext: undefined },
      ]);
      expect(spoken(store.getState().transcript).at(-1)?.text).toBe('tamam');
    });

    it('performs the action the answer chose', async () => {
      const { store, registry } = harness({
        grantDenied: true,
        textAction: { action: { name: AssistantAction.GenerateRecipe, arg: 'tavuk' } },
      });
      let ranWith: string | undefined;
      registry.register(AssistantAction.GenerateRecipe, async (arg) => {
        ranWith = arg;
        return { ok: true };
      });
      await store.getState().startVoice('tr-TR');

      store.getState().sendText('tarif yap', 'tr-TR');
      await settle();

      expect(ranWith).toBe('tavuk');
    });

    it('reports a backend it could not reach', async () => {
      const { store } = harness({ grantDenied: true, messengerFails: true });
      await store.getState().startVoice('tr-TR');

      store.getState().sendText('merhaba', 'tr-TR');
      await settle();

      expect(store.getState().error).not.toBeNull();
    });

    // `Connecting` has a socket that the server has not acknowledged, and
    // anything written into that window is discarded — the same silence this
    // whole path exists to remove.
    it('uses HTTP while the session is still connecting', async () => {
      const { store, calls } = harness();
      // Started but not awaited: the store is in Connecting.
      const starting = store.getState().startVoice('tr-TR');

      store.getState().sendText('merhaba', 'tr-TR');
      await starting;
      await settle();

      expect(calls.asks.map((a) => a.message)).toEqual(['merhaba']);
      expect(calls.texts).toEqual([]);
    });

    // With a live session the turn belongs on the socket: it carries the
    // conversation's context, and paying for a second, contextless request
    // would be both slower and dearer.
    it('uses the socket while one is open', async () => {
      const { store, calls } = harness();
      await store.getState().startVoice('tr-TR');

      store.getState().sendText('yayınla', 'tr-TR');
      await settle();

      expect(calls.texts).toEqual(['yayınla']);
      expect(calls.asks).toEqual([]);
    });
  });

  it('sends a typed turn and shows it in the transcript', async () => {
    const { store, calls } = harness();
    await store.getState().startVoice('tr-TR');

    store.getState().sendText('yayınla', 'tr-TR');

    expect(calls.texts).toEqual(['yayınla']);
    expect(spoken(store.getState().transcript).at(-1)?.text).toBe('yayınla');
  });
});
