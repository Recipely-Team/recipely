import { useState } from 'react';
import { AssistantAction } from '@domain/assistant/actions/assistant-action-type';
import { AssistantActionRegistry } from '@application/assistant/actions/assistant-action-registry';
import { renderComponent } from '@presentation/base/test-support/render-component';
import { StoresProvider } from '@presentation/bootstrap/stores-context';
import type { Stores } from '@presentation/bootstrap/stores';
import { useAssistantReadActions } from '@presentation/base/hooks/assistant/actions/use-assistant-read-actions';

/**
 * Reported while cooking: the assistant opened a recipe and was asked to read
 * it in the same breath, and answered that it could not read the recipe at
 * all. The screen was still loading, so the read saw empty lines and said
 * `no_such_step` — about a recipe that arrived a moment later.
 */
function harness() {
  const registry = new AssistantActionRegistry();
  const stores = { assistantActionRegistry: registry } as unknown as Stores;
  let setLines: (next: { ingredients: string[]; instructions: string[] }) => void = () => undefined;

  const Probe = ({ lines }: { lines: { ingredients: string[]; instructions: string[] } }): null => {
    useAssistantReadActions(lines.ingredients, lines.instructions);
    return null;
  };

  const Host = (): React.JSX.Element => {
    const [lines, setState] = useState<{ ingredients: string[]; instructions: string[] }>({ ingredients: [], instructions: [] });
    setLines = setState;
    return (
      <StoresProvider value={stores}>
        <Probe lines={lines} />
      </StoresProvider>
    );
  };

  renderComponent(<Host />);
  return { registry, arrive: (lines: { ingredients: string[]; instructions: string[] }) => setLines(lines) };
}

describe('reading a screen that is still loading', () => {
  it('waits for the recipe to arrive rather than saying there is no such step', async () => {
    const { registry, arrive } = harness();

    const reading = registry.run(AssistantAction.ReadStep);
    await Promise.resolve();
    arrive({ ingredients: ['2 yumurta'], instructions: ['Fırını ısıt.', 'Hamuru yoğur.'] });

    await expect(reading).resolves.toMatchObject({ ok: true, title: 'Fırını ısıt.' });
  });

  it('reads the ingredients that arrive while it waits', async () => {
    const { registry, arrive } = harness();

    const reading = registry.run(AssistantAction.ReadIngredients);
    await Promise.resolve();
    arrive({ ingredients: ['2 yumurta', '1 su bardağı un'], instructions: ['Karıştır.'] });

    await expect(reading).resolves.toMatchObject({ ok: true, title: '2 yumurta, 1 su bardağı un' });
  });

  it('gives up on a screen that never has anything to read', async () => {
    jest.useFakeTimers();
    try {
      const { registry } = harness();

      const reading = registry.run(AssistantAction.ReadStep);
      await jest.advanceTimersByTimeAsync(3_500);

      await expect(reading).resolves.toMatchObject({ ok: false, error: 'no_such_step' });
    } finally {
      jest.useRealTimers();
    }
  });
});
