import { AssistantStatus } from '@application/assistant/session/assistant-status';
import { AssistantWaitingLine } from '@presentation/base/widgets/assistant/parts/assistant-waiting-line';
import { renderComponent } from '@presentation/base/test-support/render-component';
import { t } from '@presentation/i18n';

/**
 * Opening a session means minting a token, opening a socket and starting two
 * audio devices — a second or two in which the controls already said "mute"
 * and "end" for a session that did not exist yet, with nothing on screen
 * saying why nothing was happening.
 */
describe('AssistantWaitingLine', () => {
  const textOf = (
    status: Parameters<typeof AssistantWaitingLine>[0]['status'],
    isMuted = false,
  ): string[] => {
    const { root, renderer } = renderComponent(
      <AssistantWaitingLine status={status} isMuted={isMuted} />,
    );
    const found = root
      .findAll((node) => typeof node.props.children === 'string')
      .map((node) => String(node.props.children));
    renderer.unmount();
    return found;
  };

  it('says the session is connecting while it is', () => {
    expect(textOf(AssistantStatus.Connecting)).toContain(t().assistant.connecting);
  });

  it('says so while it is carrying out a request', () => {
    expect(textOf(AssistantStatus.Working)).toContain(t().assistant.working);
  });

  // The one state where the assistant looks alive and is deliberately not
  // hearing anything. The slash on the orb was the only thing saying so.
  it('says the microphone is muted while a session is running', () => {
    expect(textOf(AssistantStatus.Listening, true)).toContain(t().assistant.muted);
  });

  it('says nothing about muting once the session has ended', () => {
    expect(textOf(AssistantStatus.Idle, true)).toEqual([]);
  });

  // A permanent status line would mostly repeat what the surface already
  // shows: the orb's own face and the waveform carry these better than a word.
  it.each([AssistantStatus.Idle, AssistantStatus.Listening, AssistantStatus.Speaking])(
    'shows nothing while %s',
    (status) => {
      expect(textOf(status)).toEqual([]);
    },
  );
});
