import { AssistantDenialReason } from '@domain/assistant/session/assistant-denial-reason';
import { AssistantEventKind } from '@domain/assistant/session/assistant-event-kind';
import { AssistantGrantStatus } from '@domain/assistant/session/assistant-grant-status';
import { AssistantAction } from '@domain/assistant/actions/assistant-action-type';
import { AssistantActionRegistry } from '@application/assistant/actions/assistant-action-registry';
import { AssistantStatus } from '@application/assistant/session/assistant-status';
import { configureAssistantSessionStore } from '@application/assistant/session/assistant-session-store';
import type { AssistantSessionEventType } from '@domain/assistant/session/assistant-session-event';
import type { AssistantSessionInterface } from '@domain/assistant/session/assistant-session-interface';
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
  } = {},
) {
  let emit: (event: AssistantSessionEventType) => void = () => {};
  const calls = {
    flush: 0,
    enqueued: 0,
    micStopped: 0,
    connects: 0,
    toolResponses: [] as unknown[],
    texts: [] as string[],
    mints: [] as { languageCode: string; resumptionHandle: string | undefined }[],
  };

  const session: AssistantSessionInterface = {
    connect: async () => {
      calls.connects += 1;
      return overrides.connectFails === true
        ? { ok: false, failure: new NetworkFailure('nope') }
        : { ok: true, value: undefined };
    },
    sendAudio: () => {},
    sendText: (text) => calls.texts.push(text),
    respondToTool: (_id, response) => calls.toolResponses.push(response),
    subscribe: (listener) => {
      emit = listener;
      return () => {};
    },
    close: () => {},
  };

  const microphone: MicrophoneInterface = {
    start: async () =>
      overrides.micFails === true
        ? { ok: false, failure: new NetworkFailure('denied') }
        : { ok: true, value: undefined },
    stop: async () => {
      calls.micStopped += 1;
    },
  };

  const player: AudioPlayerInterface = {
    prepare: async () => ({ ok: true, value: undefined }),
    enqueue: () => {
      calls.enqueued += 1;
    },
    flush: () => {
      calls.flush += 1;
    },
    stop: async () => {},
  };

  const tokens: AssistantTokenRepositoryInterface = {
    mintSession: async (languageCode, resumptionHandle) => {
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

  const registry = new AssistantActionRegistry();
  const store = configureAssistantSessionStore({ session, microphone, player, tokens, registry });
  openStores.push(store);
  return { store, registry, calls, emit: (event: AssistantSessionEventType) => emit(event) };
}

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

  it('reports a refused microphone and does not sit in connecting', async () => {
    const { store } = harness({ micFails: true });

    await store.getState().startVoice('tr-TR');

    expect(store.getState().status).toBe(AssistantStatus.Idle);
    expect(store.getState().error).not.toBeNull();
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

      emit({ kind: AssistantEventKind.Transcript, speaker: ChatRole.User, text: 'tavuk var', final: true });
      emit({ kind: AssistantEventKind.Transcript, speaker: ChatRole.Assistant, text: 'tamam', final: true });

      expect(store.getState().transcript.map((l) => [l.speaker, l.text])).toEqual([
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
      for (let tick = 0; tick < 12; tick += 1) await Promise.resolve();

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
      for (let tick = 0; tick < 12; tick += 1) await Promise.resolve();

      expect(calls.toolResponses).toEqual([
        { ok: false, error: 'failed' },
        { ok: true, title: 'after' },
      ]);
    });

    // The server drops the socket roughly every ten minutes BY DESIGN. A
    // session that read that as the end would die mid-conversation on a timer,
    // which is what happened while these events fell through to `default`.
    describe('surviving a goAway', () => {
      const settle = async (): Promise<void> => {
        for (let tick = 0; tick < 12; tick += 1) await Promise.resolve();
      };

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
      // Standing down closes the microphone and the player, both async.
      await Promise.resolve();
      await Promise.resolve();

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

  it('sends a typed turn and shows it in the transcript', async () => {
    const { store, calls } = harness();
    await store.getState().startVoice('tr-TR');

    store.getState().sendText('yayınla');

    expect(calls.texts).toEqual(['yayınla']);
    expect(store.getState().transcript.at(-1)?.text).toBe('yayınla');
  });
});
