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
import { AssistantStatus } from '@application/assistant/session/assistant-status';
import { AssistantTranscript } from '@presentation/base/widgets/assistant/parts/assistant-transcript';
import { AssistantTranscriptLineKind } from '@application/assistant/session/assistant-transcript-line-kind';
import { AssistantAction } from '@domain/assistant/actions/assistant-action-type';
import { AssistantWave } from '@presentation/base/widgets/assistant/parts/assistant-wave';
import { ChatRole } from '@domain/drafts/chat-role';
import { renderComponent } from '@presentation/base/test-support/render-component';
import { t } from '@presentation/i18n';

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

  describe('waveform', () => {
    // The bars are the only proof the microphone is open, so they must not keep
    // moving once it is not: a row still animating after a session ended reads
    // as a live microphone.
    it('renders the same bars whether or not it is active', () => {
      const active = render(<AssistantWave level={0.8} active color="#000000" bars={6} height={20} />);
      const resting = render(
        <AssistantWave level={0.8} active={false} color="#000000" bars={6} height={20} />,
      );

      expect(active.renderer.toJSON()).not.toEqual(resting.renderer.toJSON());
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
