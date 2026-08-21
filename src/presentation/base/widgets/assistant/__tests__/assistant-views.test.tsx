/**
 * Render tests for the assistant's three view states.
 *
 * @remarks
 * The mini bar is the state the assistant is designed to live in and the one
 * hardest to reach by hand — it only exists while a session is running — so it
 * is covered here rather than by driving a live session. The assertions are
 * about the controls a user must be able to find, not about styling.
 */

import { act } from 'react-test-renderer';
import type { ReactTestInstance } from 'react-test-renderer';
import { AssistantFab } from '@presentation/base/widgets/assistant/views/assistant-fab';
import { AssistantMiniBar } from '@presentation/base/widgets/assistant/views/assistant-mini-bar';
import { AssistantPanel } from '@presentation/base/widgets/assistant/views/assistant-panel';
import { AssistantStatus } from '@application/assistant/session/assistant-status';
import { AssistantTranscript } from '@presentation/base/widgets/assistant/parts/assistant-transcript';
import { AssistantTranscriptLineKind } from '@application/assistant/session/assistant-transcript-line-kind';
import { AssistantAction } from '@domain/assistant/actions/assistant-action-type';
import { AssistantWave } from '@presentation/base/widgets/assistant/parts/assistant-wave';
import { ChatRole } from '@domain/drafts/chat-role';
import { renderComponent } from '@presentation/base/test-support/render-component';
import { t } from '@presentation/i18n';

// The panel reads the session from the store; the views under test here are
// about which control does what, so the session is a still life.
// The vocabularies are required INSIDE the factory: jest hoists the factory
// above the imports, so naming them from the outer scope is a reference error.
// Spelling the values as raw strings instead would survive a rename of either
// vocabulary in silence, which is what rule 5 is about.
jest.mock('@presentation/base/hooks/assistant/use-assistant-session', () => ({
  useAssistantSession: () => ({
    status: jest.requireActual('@application/assistant/session/assistant-status').AssistantStatus
      .Listening,
    view: jest.requireActual('@application/assistant/session/assistant-view').AssistantView.Open,
    level: 0,
    isMuted: false,
    transcript: [],
    remainingSeconds: 600,
    deniedReason: null,
    error: null,
    clearError: jest.fn(),
    setView: jest.fn(),
    toggleMute: jest.fn(),
    toggleVoice: jest.fn(),
    sendText: jest.fn(),
  }),
}));

// The mascot blinks and the launcher pulses on a loop for as long as they are
// mounted, so a renderer left alive keeps firing timers into a torn-down Jest
// environment. Unmounting is the test's job, not a sign the loops leak.
const mounted: { unmount: () => void }[] = [];

const render = (element: Parameters<typeof renderComponent>[0]) => {
  const result = renderComponent(element);
  mounted.push(result.renderer);
  return result;
};

afterEach(() => {
  act(() => {
    while (mounted.length > 0) mounted.pop()?.unmount();
  });
});

/** Presses the control a user would find by its accessibility label. */
const press = (root: ReactTestInstance, label: string): void => {
  const target = root.findAll(
    (node) => node.props.accessibilityLabel === label && typeof node.props.onPress === 'function',
  )[0];
  if (target === undefined) throw new Error(`no pressable labelled "${label}"`);
  const onPress = target.props.onPress as () => void;
  act(() => onPress());
};

const texts = (root: ReactTestInstance): string[] =>
  root.findAll((node) => typeof node.props.children === 'string').map((node) => String(node.props.children));

describe('assistant views', () => {
  describe('launcher', () => {
    it('opens the assistant when the chef is tapped', () => {
      const onOpen = jest.fn();
      const { root } = render(<AssistantFab status={AssistantStatus.Idle} onOpen={onOpen} />);

      press(root, t().assistant.open);

      expect(onOpen).toHaveBeenCalledTimes(1);
    });
  });

  describe('mini bar', () => {
    const miniBar = (isMuted: boolean) => {
      const handlers = { onExpand: jest.fn(), onToggleMute: jest.fn(), onEnd: jest.fn() };
      const { root } = render(
        <AssistantMiniBar status={AssistantStatus.Listening} level={0.5} isMuted={isMuted} {...handlers} />,
      );
      return { root, handlers };
    };

    // Someone walked in, or the phone rang: stopping the microphone cannot be
    // behind a panel the user has to open first.
    it('offers mute and end without expanding', () => {
      const { root, handlers } = miniBar(false);

      press(root, t().assistant.mute);
      press(root, t().assistant.end);

      expect(handlers.onToggleMute).toHaveBeenCalledTimes(1);
      expect(handlers.onEnd).toHaveBeenCalledTimes(1);
      expect(handlers.onExpand).not.toHaveBeenCalled();
    });

    it('offers to unmute once muted, so the control is never a dead end', () => {
      const { root, handlers } = miniBar(true);

      press(root, t().assistant.unmute);

      expect(handlers.onToggleMute).toHaveBeenCalledTimes(1);
    });
  });

  describe('mini bar reachability', () => {
    // Putting the panel away and hanging up were the same button, so "get this
    // off my screen" ended the call — and the mini bar, the state this
    // assistant is designed to live in, could not be reached at all.
    it('separates putting the panel away from ending the session', () => {
      const onClose = jest.fn();
      const onMinimize = jest.fn();
      const { root } = render(
        <AssistantPanel onClose={onClose} onMinimize={onMinimize} bottomOffset={0} />,
      );

      press(root, t().assistant.minimize);

      expect(onMinimize).toHaveBeenCalledTimes(1);
      expect(onClose).not.toHaveBeenCalled();
    });
  });

  describe('waveform', () => {
    const opacities = (root: ReactTestInstance): number[] =>
      root
        .findAll((node) => Array.isArray(node.props.style))
        .map((node) => {
          const style = node.props.style as { opacity?: number }[];
          return Number(style[style.length - 1]?.opacity);
        })
        .filter((value) => !Number.isNaN(value));

    // The bars are the only proof the microphone is open, so they must not look
    // alive once it is not: a row still standing tall after a session ended
    // reads as a live microphone. Asserting the trees merely differ passed for
    // any styling change at all.
    it('drops every bar to the resting opacity when it is not active', () => {
      const active = render(<AssistantWave level={0.8} active color="#000000" bars={6} height={20} />);
      const resting = render(
        <AssistantWave level={0.8} active={false} color="#000000" bars={6} height={20} />,
      );

      const atRest = opacities(resting.root);
      expect(atRest.length).toBe(6);
      expect(new Set(atRest).size).toBe(1);
      expect(Math.max(...opacities(active.root))).toBeGreaterThan(atRest[0]!);
    });
  });

  describe('transcript', () => {
    it('shows an action as a receipt in the user language, not as an action key', () => {
      const { root } = render(
        <AssistantTranscript
          lines={[
            { kind: AssistantTranscriptLineKind.Speech, id: '1', speaker: ChatRole.User, text: 'tavuk ara' },
            { kind: AssistantTranscriptLineKind.Action, id: '2', action: AssistantAction.Search, detail: 'tavuk' },
          ]}
        />,
      );

      const shown = texts(root);
      expect(shown).toContain(t().assistant.actions.search);
      expect(shown).not.toContain(AssistantAction.Search);
    });
  });
});
