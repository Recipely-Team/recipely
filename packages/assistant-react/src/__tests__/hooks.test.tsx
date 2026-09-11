import { act, create } from 'react-test-renderer';
import type { ReactTestRenderer } from 'react-test-renderer';
import { AssistantController, AssistantStatus, SessionEventKind, Speaker, ToolRegistry } from '@live-assistant/core';
import type { AssistantState, AssistantTool } from '@live-assistant/core';
import { FakeMicrophone } from '@live-assistant/core/src/controller/__fixtures__/fake-microphone';
import { FakePlayer } from '@live-assistant/core/src/controller/__fixtures__/fake-player';
import { FakeSession } from '@live-assistant/core/src/controller/__fixtures__/fake-session';
import { AssistantProvider } from '../assistant-provider';
import { useAssistant } from '../use-assistant';
import { useAssistantState } from '../use-assistant-state';
import { useAssistantTool } from '../use-assistant-tool';
import { useLevelFrames } from '../use-level-frames';
import { useTranscript } from '../use-transcript';

function setup(tools = new ToolRegistry()) {
  const calls: string[] = [];
  const session = new FakeSession();
  const controller = new AssistantController<string>({
    session,
    microphone: new FakeMicrophone(calls),
    player: new FakePlayer(calls),
    getConnection: async () => 'token',
    tools,
  });
  return { controller, session };
}

const mount = (controller: AssistantController<string>, element: React.ReactElement): ReactTestRenderer => {
  let renderer!: ReactTestRenderer;
  act(() => {
    renderer = create(<AssistantProvider controller={controller}>{element}</AssistantProvider>);
  });
  return renderer;
};

const selectStatus = (state: AssistantState) => state.status;

beforeEach(() => jest.useFakeTimers());
afterEach(() => jest.useRealTimers());

describe('useAssistant', () => {
  it('shows the session state and drives it', async () => {
    const { controller } = setup();
    let latest!: ReturnType<typeof useAssistant>;
    const Probe = () => {
      latest = useAssistant();
      return null;
    };
    mount(controller, <Probe />);
    expect(latest.status).toBe(AssistantStatus.Idle);

    await act(async () => {
      await latest.start();
    });
    expect(latest.status).toBe(AssistantStatus.Listening);

    act(() => latest.toggleMute());
    expect(latest.isMuted).toBe(true);
  });

  it('refuses to work outside a provider, saying why', () => {
    const Probe = () => {
      useAssistant();
      return null;
    };
    jest.spyOn(console, 'error').mockImplementation(() => undefined);

    expect(() => act(() => void create(<Probe />))).toThrow(/inside <AssistantProvider>/);
  });
});

describe('useAssistantState', () => {
  // A component that shows only the status must not re-render for the token
  // count, the transcript, or anything else a turn changes.
  it('re-renders only when its slice changes', async () => {
    const { controller, session } = setup();
    let renders = 0;
    const Probe = () => {
      renders += 1;
      useAssistantState(selectStatus);
      return null;
    };
    mount(controller, <Probe />);
    await act(async () => {
      await controller.start();
    });
    const afterStart = renders;

    act(() => session.emit({ kind: SessionEventKind.Usage, totalTokens: 10 }));
    act(() => session.emit({ kind: SessionEventKind.Usage, totalTokens: 20 }));

    expect(renders).toBe(afterStart);
  });
});

describe('useTranscript', () => {
  it('hands over the entries to render any way the app likes', async () => {
    const { controller, session } = setup();
    let entries: ReturnType<typeof useTranscript> = [];
    const Probe = () => {
      entries = useTranscript();
      return null;
    };
    mount(controller, <Probe />);
    await act(async () => {
      await controller.start();
    });

    act(() => session.emit({ kind: SessionEventKind.Transcript, speaker: Speaker.Assistant, text: 'Hello' }));

    expect(entries).toEqual([expect.objectContaining({ speaker: Speaker.Assistant, text: 'Hello' })]);
  });
});

describe('useLevelFrames', () => {
  // The whole point of the level API: an effect that follows the voice every
  // frame without a single React render.
  it('delivers both levels every frame without re-rendering', async () => {
    const { controller } = setup();
    await controller.start();
    let renders = 0;
    const frames: { input: number; output: number }[] = [];
    const Probe = () => {
      renders += 1;
      useLevelFrames((levels) => frames.push(levels));
      return null;
    };
    mount(controller, <Probe />);

    act(() => {
      jest.advanceTimersByTime(100);
    });

    expect(frames.length).toBeGreaterThanOrEqual(4);
    expect(frames.at(-1)).toEqual({ input: 0.5, output: 0.8 });
    expect(renders).toBe(1);
  });

  // A widget mounted at the root must not wake the JS thread every frame
  // while nothing is moving.
  it('requests no frames while disabled, after one final rest at zero', async () => {
    const { controller } = setup();
    await controller.start();
    const frames: { input: number; output: number }[] = [];
    const Probe = () => {
      useLevelFrames((levels) => frames.push(levels), false);
      return null;
    };
    const raf = jest.spyOn(globalThis, 'requestAnimationFrame');
    mount(controller, <Probe />);

    act(() => {
      jest.advanceTimersByTime(100);
    });

    expect(frames).toEqual([{ input: 0, output: 0 }]);
    expect(raf).not.toHaveBeenCalled();
    raf.mockRestore();
  });

  it('stops asking for frames once unmounted', async () => {
    const { controller } = setup();
    const frames: unknown[] = [];
    const Probe = () => {
      useLevelFrames((levels) => frames.push(levels));
      return null;
    };
    const renderer = mount(controller, <Probe />);
    act(() => renderer.unmount());
    const seen = frames.length;

    act(() => {
      jest.advanceTimersByTime(100);
    });

    expect(frames.length).toBe(seen);
  });
});

describe('useAssistantTool', () => {
  it('registers while mounted, runs the latest handler, and unregisters on unmount', async () => {
    const tools = new ToolRegistry();
    const { controller } = setup(tools);
    const Probe = ({ label }: { label: string }) => {
      const tool: AssistantTool = { definition: { name: 'scroll', description: 'scrolls' }, run: () => ({ ok: true, label }) };
      useAssistantTool(tool);
      return null;
    };
    const renderer = mount(controller, <Probe label="first" />);
    act(() => renderer.update(<AssistantProvider controller={controller}><Probe label="second" /></AssistantProvider>));

    await expect(tools.run({ id: 'c', name: 'scroll', args: {} })).resolves.toEqual({
      ok: true,
      response: { ok: true, label: 'second' },
    });

    act(() => renderer.unmount());
    expect(tools.definitions()).toEqual([]);
  });
});
