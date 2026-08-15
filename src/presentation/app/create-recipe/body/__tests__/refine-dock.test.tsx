/**
 * Reported from the AI create flow: "close the assistant while it is answering
 * and you lose the loading — the user does not know a response is still
 * coming". The typing bubble lived inside the expanded transcript, so
 * collapsing the panel took the only sign of the in-flight request with it,
 * and the recipe would later rewrite itself with nothing having announced it.
 */

import { act, type ReactTestRenderer } from 'react-test-renderer';
import { renderComponent, textContent } from '@presentation/base/test-support/render-component';
import { RefineDock } from '@presentation/app/create-recipe/body/refine-dock';
import { t } from '@presentation/i18n';

const noop = (): void => undefined;

const renderDock = (overrides: { expanded: boolean; refining: boolean }): ReactTestRenderer =>
  renderComponent(
    <RefineDock
      chatHistory={[{ role: 'user', content: 'make it vegan' }]}
      chatInput=""
      onChangeChatInput={noop}
      expanded={overrides.expanded}
      onExpand={noop}
      onCollapse={noop}
      refining={overrides.refining}
      canRegenerate
      onRegenerate={noop}
      onSubmit={noop}
      proposal={null}
      onAcceptProposal={noop}
      onRejectProposal={noop}
      bottomInset={0}
    />,
  ).renderer;

describe('RefineDock — pending refine', () => {
  let renderer: ReactTestRenderer | undefined;

  afterEach(async () => {
    act(() => {
      renderer?.unmount();
    });
    renderer = undefined;
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });
  });

  it('keeps the wait visible after the assistant is collapsed', () => {
    renderer = renderDock({ expanded: false, refining: true });

    expect(textContent(renderer.root)).toContain(t().createRecipe.refining);
  });

  it('says nothing when nothing is in flight', () => {
    renderer = renderDock({ expanded: false, refining: false });

    expect(textContent(renderer.root)).not.toContain(t().createRecipe.refining);
  });

  it('does not double up on the transcript typing bubble', () => {
    renderer = renderDock({ expanded: true, refining: true });

    const waits = textContent(renderer.root).filter((text) => text === t().createRecipe.refining);
    expect(waits).toHaveLength(1);
  });
});

/**
 * Reported from the AI create flow: "when I send a message the text field
 * should empty but it stays full". The dock is a controlled input — the parent
 * owns `chatInput` — and nothing on the send path ever asked it to reset, so
 * the instruction sat there after being sent and the next one had to be typed
 * on top of it.
 *
 * The sent text is not lost by clearing: `onSubmitRefine` appends it to the
 * transcript before the request goes out, so it stays on screen as the user's
 * turn.
 */
describe('RefineDock — sending free text', () => {
  let renderer: ReactTestRenderer | undefined;

  afterEach(() => {
    act(() => renderer?.unmount());
    renderer = undefined;
  });

  const renderWithSpies = (
    chatInput: string,
    spies: { onSubmit: jest.Mock; onChangeChatInput: jest.Mock },
    refining = false,
  ): ReactTestRenderer =>
    renderComponent(
      <RefineDock
        chatHistory={[]}
        chatInput={chatInput}
        onChangeChatInput={spies.onChangeChatInput}
        expanded
        onExpand={noop}
        onCollapse={noop}
        refining={refining}
        canRegenerate
        onRegenerate={noop}
        onSubmit={spies.onSubmit}
        proposal={null}
        onAcceptProposal={noop}
        onRejectProposal={noop}
        bottomInset={0}
      />,
    ).renderer;

  const fire = (node: { props: Record<string, unknown> }, prop: string): void => {
    const handler = node.props[prop];
    if (typeof handler !== 'function') throw new Error(`${prop} is not wired`);
    act(() => (handler as () => void)());
  };

  const send = (r: ReactTestRenderer): void => {
    fire(r.root.findAll((n) => n.props.returnKeyType === 'send')[0], 'onSubmitEditing');
  };

  it('empties the field after the instruction is sent', () => {
    const spies = { onSubmit: jest.fn(), onChangeChatInput: jest.fn() };
    renderer = renderWithSpies('daha az tuzlu olsun', spies);

    send(renderer);

    expect(spies.onSubmit).toHaveBeenCalledWith('daha az tuzlu olsun');
    expect(spies.onChangeChatInput).toHaveBeenCalledWith('');
  });

  it('leaves the field alone when there is nothing to send', () => {
    const spies = { onSubmit: jest.fn(), onChangeChatInput: jest.fn() };
    renderer = renderWithSpies('   ', spies);

    send(renderer);

    expect(spies.onSubmit).not.toHaveBeenCalled();
    expect(spies.onChangeChatInput).not.toHaveBeenCalled();
  });

  // A chip sends its own instruction; whatever the cook has half-typed is
  // theirs and must survive.
  it('does not clear what is typed when a quick chip is tapped', () => {
    const spies = { onSubmit: jest.fn(), onChangeChatInput: jest.fn() };
    renderer = renderWithSpies('yarısı kadar şeker', spies);

    const chip = renderer.root.findAll(
      (n) => n.props.accessibilityLabel === t().createRecipe.chipVegan && n.props.onPress !== undefined,
    )[0];
    fire(chip, 'onPress');

    expect(spies.onSubmit).toHaveBeenCalledWith(t().createRecipe.chipVegan);
    expect(spies.onChangeChatInput).not.toHaveBeenCalled();
  });
});
