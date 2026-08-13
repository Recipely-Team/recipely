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
