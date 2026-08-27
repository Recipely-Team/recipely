import { AssistantAction } from '@domain/assistant/actions/assistant-action-type';
import { useAssistantScrollable } from '@presentation/base/hooks/assistant/actions/use-assistant-scrollable';
import { renderComponent } from '@presentation/base/test-support/render-component';
import { AssistantActionRegistry } from '@application/assistant/actions/assistant-action-registry';
import { StoresProvider } from '@presentation/bootstrap/stores-context';
import type { Stores } from '@presentation/bootstrap/stores';

/**
 * A screen that let the assistant scroll it could no longer be rendered in a
 * test: `useAssistantAction` reads `useStores`, which throws outside a
 * provider, and the shared harness supplied only theme and safe-area. So
 * "asistan bu sayfayı kaydırabilsin" cost a red suite, and most screens
 * quietly went without — the scroll gap was a harness gap.
 */
describe('renderComponent — a component that registers an assistant action', () => {
  it('renders without the caller wrapping its own StoresProvider', () => {
    const Probe = (): null => {
      useAssistantScrollable();
      return null;
    };

    // Before the fix this threw 'useStores called outside of StoresProvider'.
    expect(() => renderComponent(<Probe />)).not.toThrow();
  });

  it('lets a caller pass its own registry so the action can be run', async () => {
    const registry = new AssistantActionRegistry();
    const Probe = (): null => {
      const scrollable = useAssistantScrollable();
      scrollable.ref({ scrollTo: jest.fn() });
      return null;
    };

    renderComponent(<Probe />, { assistantActionRegistry: registry } as unknown as Partial<Stores>);

    await expect(registry.run(AssistantAction.Scroll, 'down')).resolves.toMatchObject({ ok: true });
  });

  it('still lets an inner StoresProvider win, so existing suites are unaffected', async () => {
    const inner = new AssistantActionRegistry();
    const Probe = (): null => {
      const scrollable = useAssistantScrollable();
      scrollable.ref({ scrollTo: jest.fn() });
      return null;
    };

    renderComponent(
      <StoresProvider value={{ assistantActionRegistry: inner } as unknown as Stores}>
        <Probe />
      </StoresProvider>,
    );

    // Registered on the provider the caller supplied, not the harness default —
    // which is what keeps the suites that wrap their own provider working.
    await expect(inner.run(AssistantAction.Scroll, 'down')).resolves.toMatchObject({ ok: true });
  });
});
