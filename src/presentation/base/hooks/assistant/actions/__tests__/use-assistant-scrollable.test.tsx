import { act } from 'react-test-renderer';
import { AssistantAction } from '@domain/assistant/actions/assistant-action-type';
import { AssistantActionRegistry } from '@application/assistant/actions/assistant-action-registry';
import { renderComponent } from '@presentation/base/test-support/render-component';
import { StoresProvider } from '@presentation/bootstrap/stores-context';
import type { Stores } from '@presentation/bootstrap/stores';
import { useAssistantScrollable } from '@presentation/base/hooks/assistant/actions/use-assistant-scrollable';
import type { AssistantScrollableProps } from '@presentation/base/hooks/assistant/actions/assistant-scrollable-props';

/**
 * "Aşağı kaydır" answered `unavailable_here` on every screen but two: the
 * action was registered by the feed and the recipe detail, and the lists with
 * the most rows in the app — My Recipes, the notifications feed — had no
 * handler at all. This is the hook they all now share.
 */

/** A FlatList takes an offset; a ScrollView takes a coordinate. Both are attached the same way. */
const listHandle = () => ({ scrollToOffset: jest.fn() });
const viewHandle = () => ({ scrollTo: jest.fn() });

function harness(handle: object | null, isEnabled = true) {
  const registry = new AssistantActionRegistry();
  // A box rather than a bare `let`: assigned only inside the component, TS
  // narrows a local to `null` and every read of it becomes `never`.
  const captured: { props: AssistantScrollableProps | null } = { props: null };

  const Probe = (): null => {
    captured.props = useAssistantScrollable(isEnabled);
    return null;
  };

  renderComponent(
    <StoresProvider value={{ assistantActionRegistry: registry } as unknown as Stores}>
      <Probe />
    </StoresProvider>,
  );

  const props = captured.props;
  if (props === null) throw new Error('the hook did not run');
  props.ref(handle as never);

  return { registry, props };
}

describe('useAssistantScrollable', () => {
  afterEach(async () => {
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });
  });

  it('moves a list by an offset', async () => {
    const handle = listHandle();
    const { registry } = harness(handle);

    await act(async () => {
      await expect(registry.run(AssistantAction.Scroll, 'down')).resolves.toMatchObject({ ok: true });
    });

    expect(handle.scrollToOffset).toHaveBeenCalledWith(
      expect.objectContaining({ animated: true }),
    );
  });

  it('moves a scroll view by a coordinate', async () => {
    const handle = viewHandle();
    const { registry } = harness(handle);

    await act(async () => {
      await registry.run(AssistantAction.Scroll, 'top');
    });

    expect(handle.scrollTo).toHaveBeenCalledWith({ y: 0, animated: true });
  });

  // A relative step needs to know where the list is, and neither kind of list
  // can be asked — so the offset is remembered from the scrolls the user makes.
  it('steps down from where the user left the list', async () => {
    const handle = listHandle();
    const { registry, props } = harness(handle);

    act(() => {
      props.onScroll({ nativeEvent: { contentOffset: { y: 500 } } } as never);
    });
    await act(async () => {
      await registry.run(AssistantAction.Scroll, 'up');
    });

    const offset = handle.scrollToOffset.mock.calls[0][0].offset as number;
    expect(offset).toBeLessThan(500);
  });

  // A shared container renders either a scroll view or a plain view. Saying
  // "scrolled" for the second is a lie the user can see.
  it('registers nothing when the caller is not rendering a scrollable', async () => {
    const { registry } = harness(listHandle(), false);

    await act(async () => {
      await expect(registry.run(AssistantAction.Scroll, 'down')).resolves.toMatchObject({
        ok: false,
      });
    });
  });

  // The screens that reported "kaydırdım" over a motionless list: the feed's
  // wide-layout, search and loading branches never attached anything, and the
  // action's answer did not depend on whether they had.
  it('answers nothing_to_scroll when no list was ever attached', async () => {
    const { registry } = harness(null);

    await act(async () => {
      await expect(registry.run(AssistantAction.Scroll, 'down')).resolves.toMatchObject({
        ok: false,
        error: 'nothing_to_scroll',
      });
    });
  });

  it('answers nothing_to_scroll for a handle that can do none of the three', async () => {
    const { registry } = harness({});

    await act(async () => {
      await expect(registry.run(AssistantAction.Scroll, 'down')).resolves.toMatchObject({
        ok: false,
        error: 'nothing_to_scroll',
      });
    });
  });
});
