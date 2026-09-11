import { AssistantFailureCode, fail, ok } from '@live-assistant/core';
import type { AssistantMicrophone, AssistantPlayer } from '@live-assistant/core';
import { FailureCode } from '@core/failure/failure-code';
import { Microphone } from '@infrastructure/assistant/live/audio/microphone';
import { PcmPlayer } from '@infrastructure/assistant/live/audio/pcm-player';

// The library's default implementations load the native audio module, which
// does not exist under Jest; every test here injects its own.
jest.mock('@live-assistant/audio', () => ({ Microphone: class {}, PcmPlayer: class {} }));

/**
 * The seams between the app and `@live-assistant/audio`: the store must see
 * the same Failure kinds it saw before the capture and playback code moved.
 */
const capture = (overrides: Partial<AssistantMicrophone> = {}): AssistantMicrophone => ({
  cancelsEcho: true,
  level: () => 0,
  ensureAccess: jest.fn(async () => ok(undefined)),
  start: jest.fn(async () => ok(undefined)),
  stop: jest.fn(async () => undefined),
  ...overrides,
});

const output = (overrides: Partial<AssistantPlayer> = {}): AssistantPlayer => ({
  level: () => 0,
  prepare: jest.fn(async () => ok(undefined)),
  enqueue: jest.fn(),
  flush: jest.fn(),
  stop: jest.fn(async () => undefined),
  ...overrides,
});

describe('Microphone over the library', () => {
  it('reports a refusal as the Forbidden failure the store explains to the user', async () => {
    const microphone = new Microphone(
      capture({ ensureAccess: async () => fail({ code: AssistantFailureCode.MicrophoneDenied }) }),
    );

    const result = await microphone.ensureAccess();

    expect(!result.ok && result.failure.code).toBe(FailureCode.Forbidden);
  });

  it('passes capture, echo cancellation and stop straight through', async () => {
    const inner = capture({ cancelsEcho: false });
    const microphone = new Microphone(inner);
    const onFrame = (): void => undefined;

    await expect(microphone.start(16_000, onFrame)).resolves.toEqual({ ok: true, value: undefined });
    await microphone.stop();

    expect(microphone.cancelsEcho).toBe(false);
    expect(inner.start).toHaveBeenCalledWith(16_000, onFrame);
    expect(inner.stop).toHaveBeenCalled();
  });
});

describe('PcmPlayer over the library', () => {
  it('reports an output that cannot open as an Unknown failure', async () => {
    const player = new PcmPlayer(
      output({ prepare: async () => fail({ code: AssistantFailureCode.PlayerUnavailable, detail: 'no device' }) }),
    );

    const result = await player.prepare(24_000);

    expect(!result.ok && result.failure.code).toBe(FailureCode.Unknown);
  });

  it('passes enqueue, flush and stop straight through', async () => {
    const inner = output();
    const player = new PcmPlayer(inner);
    const chunk = new Float32Array(4);

    player.enqueue(chunk);
    player.flush();
    await player.stop();

    expect(inner.enqueue).toHaveBeenCalledWith(chunk);
    expect(inner.flush).toHaveBeenCalled();
    expect(inner.stop).toHaveBeenCalled();
  });
});
