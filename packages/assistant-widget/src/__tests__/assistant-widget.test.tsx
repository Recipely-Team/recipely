import { Profiler } from 'react';
import { Text } from 'react-native';
import { act, create } from 'react-test-renderer';
import type { ReactTestInstance, ReactTestRenderer } from 'react-test-renderer';
import {
  AssistantController,
  AssistantFailureCode,
  SessionEventKind,
  Speaker,
  ToolRegistry,
  fail,
} from '@live-assistant/core';
import { AssistantProvider } from '@live-assistant/react';
import { FakeMicrophone } from '@live-assistant/core/src/controller/__fixtures__/fake-microphone';
import { FakePlayer } from '@live-assistant/core/src/controller/__fixtures__/fake-player';
import { FakeSession } from '@live-assistant/core/src/controller/__fixtures__/fake-session';
import { AssistantWidget } from '../assistant-widget';
import type { AssistantWidgetProps } from '../assistant-widget';
import { AssistantOrb } from '../orb/assistant-orb';

function setup(tools = new ToolRegistry()) {
  const calls: string[] = [];
  const session = new FakeSession();
  const microphone = new FakeMicrophone(calls);
  const controller = new AssistantController<string>({
    session,
    microphone,
    player: new FakePlayer(calls),
    getConnection: async () => 'token',
    tools,
  });
  return { controller, session, microphone };
}

function mount(controller: AssistantController<string>, props: AssistantWidgetProps = {}): ReactTestRenderer {
  let renderer!: ReactTestRenderer;
  act(() => {
    renderer = create(
      <AssistantProvider controller={controller}>
        <AssistantWidget {...props} />
      </AssistantProvider>,
    );
  });
  return renderer;
}

const texts = (renderer: ReactTestRenderer): string[] =>
  renderer.root
    .findAllByType(Text)
    .map((node) => [node.props.children].flat().join(''))
    .filter((text) => text.length > 0);

const byLabel = (renderer: ReactTestRenderer, label: string): ReactTestInstance =>
  renderer.root.find((node) => node.props.accessibilityLabel === label && typeof node.props.onPress === 'function');

const press = (node: ReactTestInstance): void => (node.props.onPress as () => void)();

beforeEach(() => jest.useFakeTimers());
afterEach(() => jest.useRealTimers());

describe('AssistantWidget', () => {
  it('starts from the orb and opens the conversation while live', async () => {
    const { controller } = setup();
    const renderer = mount(controller);
    expect(texts(renderer)).toContain('Tap to talk');

    await act(async () => {
      press(byLabel(renderer, 'Start voice assistant'));
      await jest.advanceTimersByTimeAsync(0);
    });

    expect(texts(renderer)).toEqual(expect.arrayContaining(['Listening', 'Mute', 'End']));
  });

  it('speaks the app’s language when given its strings', async () => {
    const { controller } = setup();
    await controller.start();

    const renderer = mount(controller, { strings: { status: { listening: 'Dinliyorum' }, stop: 'Bitir' } });

    expect(texts(renderer)).toEqual(expect.arrayContaining(['Dinliyorum', 'Bitir']));
    expect(texts(renderer)).toContain('Mute');
  });

  it('renders each line through renderMessage, with the default bubble to wrap', async () => {
    const { controller, session } = setup();
    await controller.start();
    const renderer = mount(controller, {
      renderMessage: (entry, fallback) => (
        <>
          <Text>{entry.speaker === Speaker.User ? 'You' : 'Bot'}</Text>
          {fallback}
        </>
      ),
    });

    act(() => session.emit({ kind: SessionEventKind.Transcript, speaker: Speaker.Assistant, text: 'Hello there' }));

    expect(texts(renderer)).toEqual(expect.arrayContaining(['Bot', 'Hello there']));
  });

  it('shows a running tool, hides it once it succeeded, and lets renderTool show every run', async () => {
    let finish!: () => void;
    const tools = new ToolRegistry([
      {
        definition: { name: 'openSettings', description: 'opens settings' },
        run: () => new Promise((resolve) => (finish = () => resolve({ ok: true }))),
      },
    ]);
    const { controller, session } = setup(tools);
    await controller.start();
    const renderer = mount(controller);

    await act(async () => {
      session.emit({ kind: SessionEventKind.ToolCall, call: { id: 'c', name: 'openSettings', args: {} } });
      await jest.advanceTimersByTimeAsync(0);
    });
    expect(texts(renderer)).toContain('Running openSettings…');

    await act(async () => {
      finish();
      await jest.advanceTimersByTimeAsync(0);
    });
    expect(texts(renderer)).not.toContain('Running openSettings…');

    const custom = mount(controller, { renderTool: (entry) => <Text>{`✓ ${entry.call.name}`}</Text> });
    expect(texts(custom)).toContain('✓ openSettings');
  });

  it('says why a session could not start, in the app’s words', async () => {
    const { controller, microphone } = setup();
    microphone.access = fail({ code: AssistantFailureCode.MicrophoneDenied });
    const renderer = mount(controller, { strings: { errors: { microphone_denied: 'Mikrofon kapalı' } } });

    await act(async () => {
      await controller.start();
    });

    expect(texts(renderer)).toContain('Mikrofon kapalı');
  });

  it('sends a typed turn from the composer', async () => {
    const { controller, session } = setup();
    await controller.start();
    const renderer = mount(controller);
    const input = renderer.root.find(
      (node) => node.props.accessibilityLabel === 'Type a message' && typeof node.props.onChangeText === 'function',
    );

    act(() => (input.props.onChangeText as (text: string) => void)('  what time is it  '));
    act(() => press(byLabel(renderer, 'Send')));

    expect(session.texts).toEqual(['what time is it']);
  });
});

describe('AssistantOrb', () => {
  // A standalone orb was a button labelled "Start voice assistant" that did nothing.
  it('starts and stops the session on its own when no onPress is given', async () => {
    const { controller } = setup();
    let renderer!: ReactTestRenderer;
    act(() => {
      renderer = create(
        <AssistantProvider controller={controller}>
          <AssistantOrb />
        </AssistantProvider>,
      );
    });

    await act(async () => {
      press(byLabel(renderer, 'Start voice assistant'));
      await jest.advanceTimersByTimeAsync(0);
    });
    expect(controller.getState().status).toBe('listening');

    await act(async () => {
      press(byLabel(renderer, 'End'));
      await jest.advanceTimersByTimeAsync(0);
    });
    expect(controller.getState().status).toBe('idle');
  });

  // Levels change every frame; the orb must follow them without rendering.
  it('follows both voices without re-rendering', async () => {
    const { controller } = setup();
    await controller.start();
    let commits = 0;
    act(() => {
      create(
        <AssistantProvider controller={controller}>
          <Profiler id="orb" onRender={() => (commits += 1)}>
            <AssistantOrb />
          </Profiler>
        </AssistantProvider>,
      );
    });
    const afterMount = commits;

    await act(async () => {
      await jest.advanceTimersByTimeAsync(500);
    });

    expect(commits - afterMount).toBeLessThanOrEqual(1);
  });
});
