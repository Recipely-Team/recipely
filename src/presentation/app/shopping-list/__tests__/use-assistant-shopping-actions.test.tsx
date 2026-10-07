import { act } from 'react-test-renderer';
import { AssistantAction } from '@domain/assistant/actions/assistant-action-type';
import { AssistantActionError } from '@domain/assistant/actions/assistant-action-error';
import type { ShoppingItemEntity } from '@domain/shopping/items/shopping-item-entity';
import { AssistantActionRegistry } from '@application/assistant/actions/assistant-action-registry';
import type { ApplicationStores } from '@application/di/application-stores';
import { shoppingItemOf } from '@application/shopping/__fixtures__/shopping-fixtures';
import { ListState } from '@presentation/base/hooks/assistant/args/describing/list-state';
import { renderComponent } from '@presentation/base/test-support/render-component';
import { StoresProvider } from '@presentation/bootstrap/stores-context';
import { useAssistantShoppingActions } from '@presentation/app/shopping-list/hooks/use-assistant-shopping-actions';

/**
 * **"Tick the milk" on the shopping list.** The assistant ticks a line by position or by name, never
 * un-ticks one the user already bought, and says NotReady / NotFound instead of guessing.
 */
const ITEMS = [
  shoppingItemOf({ id: 'a', label: 'Milk', quantity: 1, unit: 'l', position: 0 }),
  shoppingItemOf({ id: 'b', label: 'Eggs', quantity: null, unit: null, checked: true, position: 1 }),
];

function harness(items: readonly ShoppingItemEntity[] = ITEMS) {
  const registry = new AssistantActionRegistry();
  const spies = { onToggle: jest.fn(), onReload: jest.fn() };
  const Probe = (): null => {
    useAssistantShoppingActions({ items, listState: ListState.Ready, ...spies });
    return null;
  };
  renderComponent(
    <StoresProvider value={{ assistantActionRegistry: registry } as unknown as ApplicationStores}>
      <Probe />
    </StoresProvider>,
  );
  return { registry, spies };
}

describe('useAssistantShoppingActions', () => {
  it('ticks the line the user named', async () => {
    const { registry, spies } = harness();

    await act(async () => {
      await expect(registry.run(AssistantAction.ToggleIngredient, 'milk')).resolves.toMatchObject({ ok: true, title: 'Milk' });
    });

    expect(spies.onToggle).toHaveBeenCalledWith(ITEMS[0]);
  });

  it('does not un-tick a line that is already bought', async () => {
    const { registry, spies } = harness();

    await act(async () => {
      await expect(registry.run(AssistantAction.ToggleIngredient, '2')).resolves.toMatchObject({ ok: true, title: 'Eggs' });
    });

    expect(spies.onToggle).not.toHaveBeenCalled();
  });

  it('answers NotFound for a line that is not on the list', async () => {
    const { registry, spies } = harness();

    await act(async () => {
      await expect(registry.run(AssistantAction.ToggleIngredient, 'saffron')).resolves.toMatchObject({ ok: false, error: AssistantActionError.NotFound });
    });

    expect(spies.onToggle).not.toHaveBeenCalled();
  });

  it('answers NotReady while the list is empty', async () => {
    const { registry } = harness([]);

    await act(async () => {
      await expect(registry.run(AssistantAction.ToggleIngredient, '1')).resolves.toMatchObject({ ok: false, error: AssistantActionError.NotReady });
    });
  });

  it('reloads the list on Refresh', async () => {
    const { registry, spies } = harness();

    await act(async () => {
      await registry.run(AssistantAction.Refresh);
    });

    expect(spies.onReload).toHaveBeenCalledTimes(1);
  });
});
