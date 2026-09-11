import { FakeMicrophone } from '../__fixtures__/fake-microphone';
import { FakePlayer } from '../__fixtures__/fake-player';
import { FakeSession } from '../__fixtures__/fake-session';
import { AssistantController } from '../assistant-controller';
import { AssistantStatus } from '../assistant-status';
import { EndReason } from '../end-reason';
import { AssistantFailureCode } from '../../result/failure-code';
import { fail } from '../../result/result';
import { SessionEventKind } from '../../session/session-event-kind';
import { Speaker } from '../../session/speaker';
import { ToolRunStatus } from '../../conversation/tool-run-status';
import { TranscriptEntryKind } from '../../conversation/transcript-entry-kind';
import { ToolRegistry } from '../../tools/tool-registry';
import type { AssistantControllerOptions } from '../assistant-controller-options';

const settle = async (): Promise<void> => {
  await jest.advanceTimersByTimeAsync(0);
};

function build(overrides: Partial<AssistantControllerOptions<string>> = {}) {
  const calls: string[] = [];
  const session = new FakeSession();
  const microphone = new FakeMicrophone(calls);
  const player = new FakePlayer(calls);
  let now = 1_000;
  const tokens: (string | undefined)[] = [];
  const controller = new AssistantController<string>({
    session,
    microphone,
    player,
    getConnection: async (request) => {
      calls.push('getConnection');
      tokens.push(request.resumptionHandle);
      return `token-${tokens.length}`;
    },
    clock: () => now,
    ...overrides,
  });
  const tick = (ms: number): void => {
    now += ms;
  };
  return { controller, session, microphone, player, calls, tokens, tick };
}

async function started(overrides: Partial<AssistantControllerOptions<string>> = {}) {
  const parts = build(overrides);
  await parts.controller.start();
  parts.calls.length = 0;
  return parts;
}

beforeEach(() => jest.useFakeTimers());
afterEach(() => jest.useRealTimers());

describe('AssistantController — starting', () => {
  // Asked last, a failure earlier meant the user was never prompted at all;
  // the player must exist before a greeting arrives; the subscription before
  // connect, or what arrives in between is gone.
  it('asks for the microphone first and connects last', async () => {
    const { controller, session, calls } = build();

    await expect(controller.start()).resolves.toEqual({ ok: true, value: undefined });

    expect(calls).toEqual(['access', 'getConnection', 'mic.start', 'player.prepare']);
    expect(session.connectedWith).toEqual(['token-1']);
    expect(session.isSubscribed).toBe(true);
    expect(controller.getState().status).toBe(AssistantStatus.Listening);
  });

  it('spends nothing when the microphone is refused', async () => {
    const { controller, microphone, calls } = build();
    microphone.access = fail({ code: AssistantFailureCode.MicrophoneDenied });

    const result = await controller.start();

    expect(result).toEqual({ ok: false, failure: { code: AssistantFailureCode.MicrophoneDenied } });
    expect(calls).not.toContain('getConnection');
    expect(controller.getState()).toMatchObject({
      status: AssistantStatus.Idle,
      endReason: EndReason.Failed,
      error: { code: AssistantFailureCode.MicrophoneDenied },
    });
  });

  it('hands back what getConnection threw, so the app can tell its own reasons apart', async () => {
    const refusal = { reason: 'daily_limit' };
    const { controller, calls } = build({
      getConnection: async () => {
        throw refusal;
      },
    });

    const result = await controller.start();

    expect(!result.ok && result.failure).toEqual({ code: AssistantFailureCode.ConnectionRefused, cause: refusal });
    expect(calls).not.toContain('mic.start');
  });

  // Stopping while connecting used to leave a socket open and a microphone on,
  // billing under an idle UI.
  it('releases everything it opened when stopped mid-connect', async () => {
    const { controller, session, microphone, calls } = build();
    let open!: () => void;
    session.connectGate = new Promise((resolve) => {
      open = resolve;
    });

    const starting = controller.start();
    await settle();
    await controller.stop();
    open();
    await starting;

    expect(controller.getState().status).toBe(AssistantStatus.Idle);
    expect(microphone.running).toBe(false);
    expect(session.isSubscribed).toBe(false);
    expect(calls.filter((c) => c === 'player.stop').length).toBeGreaterThanOrEqual(1);
  });

  it('tears down and reports a connect that fails', async () => {
    const { controller, session, microphone } = build();
    session.connectResult = fail({ code: AssistantFailureCode.SocketFailed });

    await controller.start();

    expect(controller.getState()).toMatchObject({
      status: AssistantStatus.Idle,
      error: { code: AssistantFailureCode.SocketFailed },
    });
    expect(microphone.running).toBe(false);
  });
});

describe('AssistantController — the microphone', () => {
  it('withholds frames while muted, and the input level reads silent', async () => {
    const { controller, session, microphone } = await started();

    controller.setMuted(true);
    microphone.frame();
    expect(session.audio).toHaveLength(0);
    expect(controller.inputLevel.level()).toBe(0);

    controller.setMuted(false);
    microphone.frame();
    expect(session.audio).toHaveLength(1);
    expect(controller.inputLevel.level()).toBe(0.5);
  });

  // Without echo cancellation the model heard its own sentence and answered it
  // on repeat; the microphone stays shut while it is audible, plus a tail.
  it('holds the microphone shut while the assistant is audible, where echo is not cancelled', async () => {
    const { session, microphone, player, tick } = await started();
    microphone.cancelsEcho = false;
    player.remaining = 1;

    microphone.frame();
    expect(session.audio).toHaveLength(0);

    player.remaining = 0;
    tick(1_000 + 100);
    microphone.frame();
    expect(session.audio).toHaveLength(0);

    tick(200);
    microphone.frame();
    expect(session.audio).toHaveLength(1);
  });

  it('keeps listening over the assistant where the platform cancels echo, so the user can interrupt', async () => {
    const { session, microphone, player } = await started();
    player.remaining = 5;

    microphone.frame();

    expect(session.audio).toHaveLength(1);
  });
});

describe('AssistantController — a turn', () => {
  it('joins the user utterance, then treats the pause as the model’s turn', async () => {
    const { controller, session } = await started();

    session.emit({ kind: SessionEventKind.Transcript, speaker: Speaker.User, text: 'set an ' });
    session.emit({ kind: SessionEventKind.Transcript, speaker: Speaker.User, text: 'alarm' });
    expect(controller.getState().status).toBe(AssistantStatus.Listening);

    await jest.advanceTimersByTimeAsync(1_200);

    expect(controller.getState().status).toBe(AssistantStatus.Thinking);
    expect(controller.getState().transcript).toEqual([
      expect.objectContaining({ kind: TranscriptEntryKind.Message, text: 'set an alarm', isFinal: true }),
    ]);
  });

  // Three questions went unanswered while the UI said "listening".
  it('says so when no answer comes, and clears it when anything arrives', async () => {
    const { controller, session } = await started();
    session.emit({ kind: SessionEventKind.Transcript, speaker: Speaker.User, text: 'hello?' });
    await jest.advanceTimersByTimeAsync(1_200 + 12_000);

    expect(controller.getState()).toMatchObject({
      status: AssistantStatus.Listening,
      error: { code: AssistantFailureCode.NoAnswer },
    });

    session.emit({ kind: SessionEventKind.Transcript, speaker: Speaker.Assistant, text: 'Yes' });
    expect(controller.getState().error).toBeNull();
  });

  // turnComplete arrives when the reply is SENT, seconds before it is heard.
  it('stays speaking until the queued reply has played', async () => {
    const { controller, session, player } = await started();
    session.emit({ kind: SessionEventKind.Audio, samples: new Float32Array(10) });
    expect(player.enqueued).toHaveLength(1);
    expect(controller.getState().status).toBe(AssistantStatus.Speaking);

    player.remaining = 2;
    session.emit({ kind: SessionEventKind.TurnComplete });
    await jest.advanceTimersByTimeAsync(1_900);
    expect(controller.getState().status).toBe(AssistantStatus.Speaking);

    await jest.advanceTimersByTimeAsync(200);
    expect(controller.getState().status).toBe(AssistantStatus.Listening);
  });

  it('drops the unheard reply the moment the user talks over it', async () => {
    const { controller, session, player } = await started();
    session.emit({ kind: SessionEventKind.Audio, samples: new Float32Array(10) });

    session.emit({ kind: SessionEventKind.Interrupted });

    expect(player.flushes).toBe(1);
    expect(controller.getState().status).toBe(AssistantStatus.Listening);
  });

  it('sends a typed turn only over a live session', async () => {
    const idle = build();
    expect(idle.controller.sendText('hi')).toBe(false);

    const { controller, session } = await started();
    expect(controller.sendText('hi')).toBe(true);
    expect(session.texts).toEqual(['hi']);
    expect(controller.getState().status).toBe(AssistantStatus.Thinking);
    expect(controller.getState().transcript.at(-1)).toMatchObject({ speaker: Speaker.User, text: 'hi', isFinal: true });
  });
});

describe('AssistantController — tools', () => {
  it('runs calls one at a time, in order, and answers each', async () => {
    const order: string[] = [];
    let finishFirst!: () => void;
    const tools = new ToolRegistry([
      {
        definition: { name: 'open', description: 'opens' },
        run: () =>
          new Promise((resolve) => {
            order.push('open:start');
            finishFirst = () => {
              order.push('open:end');
              resolve({ ok: true });
            };
          }),
      },
      { definition: { name: 'share', description: 'shares' }, run: () => (order.push('share'), { ok: true }) },
    ]);
    const { controller, session } = await started({ tools });

    session.emit({ kind: SessionEventKind.ToolCall, call: { id: 'a', name: 'open', args: {} } });
    session.emit({ kind: SessionEventKind.ToolCall, call: { id: 'b', name: 'share', args: {} } });
    await settle();
    expect(controller.getState().status).toBe(AssistantStatus.Working);
    expect(order).toEqual(['open:start']);

    finishFirst();
    await settle();

    expect(order).toEqual(['open:start', 'open:end', 'share']);
    expect(session.responses.map((r) => r.call.id)).toEqual(['a', 'b']);
    expect(controller.getState().transcript.map((e) => e.kind === TranscriptEntryKind.Tool && e.status)).toEqual([
      ToolRunStatus.Succeeded,
      ToolRunStatus.Succeeded,
    ]);
    expect(controller.getState().status).toBe(AssistantStatus.Thinking);
  });

  // Passing through listening on the way made a UI flash "listening" between
  // the tool finishing and the reply starting — caught against the live API.
  it('goes from working straight to thinking, never through listening', async () => {
    const tools = new ToolRegistry([{ definition: { name: 'open', description: 'opens' }, run: () => ({ ok: true }) }]);
    const { controller, session } = await started({ tools });
    const statuses: string[] = [];
    controller.subscribe(() => statuses.push(controller.getState().status));

    session.emit({ kind: SessionEventKind.ToolCall, call: { id: 'a', name: 'open', args: {} } });
    await settle();

    expect([...new Set(statuses)]).toEqual([AssistantStatus.Working, AssistantStatus.Thinking]);
  });

  it('never runs or answers a call the model withdrew', async () => {
    const run = jest.fn(() => ({ ok: true }));
    const { controller, session } = await started({
      tools: new ToolRegistry([{ definition: { name: 'open', description: 'opens' }, run }]),
    });

    session.emit({ kind: SessionEventKind.ToolCall, call: { id: 'a', name: 'open', args: {} } });
    session.emit({ kind: SessionEventKind.ToolCallCancelled, callIds: ['a'] });
    await settle();

    expect(run).not.toHaveBeenCalled();
    expect(session.responses).toEqual([]);
    expect(controller.getState().transcript[0]).toMatchObject({ status: ToolRunStatus.Cancelled });
  });

  it('answers a name nobody registered, so the turn does not stall', async () => {
    const { session } = await started();

    session.emit({ kind: SessionEventKind.ToolCall, call: { id: 'a', name: 'launchRocket', args: {} } });
    await settle();

    expect(session.responses).toEqual([{ call: expect.objectContaining({ id: 'a' }), response: { ok: false, error: 'unknown_tool' } }]);
  });
});

describe('AssistantController — the connection', () => {
  it('continues on a new credential, minted with the handle, after a goAway', async () => {
    const { controller, session, tokens } = await started();
    session.emit({ kind: SessionEventKind.Resumption, handle: 'h-1' });
    session.emit({ kind: SessionEventKind.GoAway, timeLeftMs: 5_000 });

    session.emit({ kind: SessionEventKind.Closed, expected: false });
    await settle();

    expect(tokens).toEqual([undefined, 'h-1']);
    expect(session.connectedWith).toEqual(['token-1', 'token-2']);
    expect(controller.getState().status).toBe(AssistantStatus.Listening);
  });

  // A server re-issuing goAway at once would otherwise mint and connect forever.
  it('gives up after too many handovers without a completed turn', async () => {
    const { controller, session } = await started({ timing: { maxHandovers: 1 } });
    for (let i = 0; i < 2; i++) {
      session.emit({ kind: SessionEventKind.Resumption, handle: `h-${i}` });
      session.emit({ kind: SessionEventKind.GoAway, timeLeftMs: 0 });
      session.emit({ kind: SessionEventKind.Closed, expected: false });
      await settle();
    }

    expect(controller.getState()).toMatchObject({
      status: AssistantStatus.Idle,
      error: { code: AssistantFailureCode.ConnectionLost },
    });
  });

  it('drops a tool answer meant for the socket that was replaced', async () => {
    let finish!: () => void;
    const tools = new ToolRegistry([
      {
        definition: { name: 'slow', description: 'slow' },
        run: () => new Promise((resolve) => (finish = () => resolve({ ok: true }))),
      },
    ]);
    const { session } = await started({ tools });
    session.emit({ kind: SessionEventKind.ToolCall, call: { id: 'old', name: 'slow', args: {} } });
    await settle();

    session.emit({ kind: SessionEventKind.Resumption, handle: 'h' });
    session.emit({ kind: SessionEventKind.GoAway, timeLeftMs: 0 });
    session.emit({ kind: SessionEventKind.Closed, expected: false });
    await settle();
    finish();
    await settle();

    expect(session.responses).toEqual([]);
  });

  it('ends with connection_lost when the socket drops without warning', async () => {
    const { controller, session } = await started();

    session.emit({ kind: SessionEventKind.Closed, expected: false });
    await settle();

    expect(controller.getState()).toMatchObject({
      status: AssistantStatus.Idle,
      endReason: EndReason.Failed,
      error: { code: AssistantFailureCode.ConnectionLost },
    });
  });

  it('ends a session nobody is talking in, and says why', async () => {
    const { controller } = await started();

    await jest.advanceTimersByTimeAsync(90_000);

    expect(controller.getState()).toMatchObject({ status: AssistantStatus.Idle, endReason: EndReason.Silence });
  });

  it('never ends for silence when the app opts out, or while muted', async () => {
    const optedOut = await started({ timing: { silenceTimeoutMs: null } });
    const muted = await started();
    muted.controller.setMuted(true);

    await jest.advanceTimersByTimeAsync(600_000);

    expect(optedOut.controller.getState().status).toBe(AssistantStatus.Listening);
    expect(muted.controller.getState().status).toBe(AssistantStatus.Listening);
  });
});

describe('AssistantController — state for a UI', () => {
  it('publishes a new snapshot on change, and survives a subscriber that throws', async () => {
    const { controller, session } = await started();
    const seen: unknown[] = [];
    controller.subscribe(() => {
      throw new Error('bad render');
    });
    controller.subscribe(() => seen.push(controller.getState()));
    const before = controller.getState();

    session.emit({ kind: SessionEventKind.Usage, totalTokens: 42 });

    expect(controller.getState()).not.toBe(before);
    expect(controller.getState().tokensUsed).toBe(42);
    expect(seen).toHaveLength(1);
  });

  it('reads the output level from the player, untouched by React state', async () => {
    const { controller } = await started();

    expect(controller.outputLevel.level()).toBe(0.8);
  });
});
