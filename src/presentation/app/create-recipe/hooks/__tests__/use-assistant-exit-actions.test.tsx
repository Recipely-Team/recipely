import { act } from 'react-test-renderer';
import { AssistantAction } from '@domain/assistant/actions/assistant-action-type';
import { AssistantActionRegistry } from '@application/assistant/actions/assistant-action-registry';
import { renderComponent } from '@presentation/base/test-support/render-component';
import { StoresProvider } from '@presentation/bootstrap/stores-context';
import type { Stores } from '@presentation/bootstrap/stores';
import { useAssistantExitActions } from '@presentation/app/create-recipe/hooks/use-assistant-exit-actions';

/**
 * "Çık ama kaydetme" saved the draft. `goBack` reached the global handler,
 * which pops the route — walking straight past the question this screen asks
 * about unpublished work, and leaving the autosaved draft in My Recipes. The
 * user said they did not want it saved and watched it be saved.
 */

function harness(isExitPending: boolean, asks = true, canLeave = true) {
  const registry = new AssistantActionRegistry();
  const spies = {
    onClose: jest.fn(() => asks),
    onSaveDraftAndExit: jest.fn(),
    onDiscardAndExit: jest.fn(),
  };

  const Probe = (): null => {
    useAssistantExitActions({ canLeave, isExitPending, ...spies });
    return null;
  };

  renderComponent(
    <StoresProvider value={{ assistantActionRegistry: registry } as unknown as Stores}>
      <Probe />
    </StoresProvider>,
  );

  return { registry, spies };
}

describe('useAssistantExitActions', () => {
  afterEach(async () => {
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });
  });

  it('leaves through the screen’s own close, not the router', async () => {
    const { registry, spies } = harness(false);

    await act(async () => {
      await registry.run(AssistantAction.GoBack);
    });

    expect(spies.onClose).toHaveBeenCalled();
  });

  // A sheet opened and reported as a clean exit leaves the model announcing it
  // left while the user reads a question nobody told them to answer.
  it('says a question is pending when leaving asked one', async () => {
    const { registry } = harness(false);

    await act(async () => {
      await expect(registry.run(AssistantAction.GoBack)).resolves.toMatchObject({
        ok: true,
        awaiting: true,
      });
    });
  });

  it('reports a clean exit when there was nothing to decide', async () => {
    const { registry } = harness(false, false);

    await act(async () => {
      const result = await registry.run(AssistantAction.GoBack);
      expect(result.awaiting).toBeUndefined();
    });
  });

  it('saves the draft on a spoken yes', async () => {
    const { registry, spies } = harness(true);

    await act(async () => {
      await registry.run(AssistantAction.Confirm);
    });

    expect(spies.onSaveDraftAndExit).toHaveBeenCalled();
    expect(spies.onDiscardAndExit).not.toHaveBeenCalled();
  });

  // "Kaydetmek istemiyorum" is the sheet's discard button, and it is the whole
  // point of the fix: the only path that removes the autosaved draft.
  it('discards it on a spoken no', async () => {
    const { registry, spies } = harness(true);

    await act(async () => {
      await registry.run(AssistantAction.Cancel);
    });

    expect(spies.onDiscardAndExit).toHaveBeenCalled();
    expect(spies.onSaveDraftAndExit).not.toHaveBeenCalled();
  });

  it('answers "kaydet" while the sheet is up', async () => {
    const { registry, spies } = harness(true);

    await act(async () => {
      await registry.run(AssistantAction.Save);
    });

    expect(spies.onSaveDraftAndExit).toHaveBeenCalled();
  });

  // Nothing is pending, so a "yes" said to something else must not answer a
  // sheet that is not on screen — and `save` here would mean the recipe, not
  // the draft.
  // Opening the exit question UNDER the publish confirmation stacked two
  // sheets: the publish one on top, and a spoken "hayır" now wired to the exit
  // sheet underneath — which discards the draft. The user would have been
  // looking at "Yayınlansın mı?" while their work was deleted.
  it('does not offer to leave from behind another sheet', async () => {
    const { registry, spies } = harness(false, true, false);

    await act(async () => {
      await expect(registry.run(AssistantAction.GoBack)).resolves.toMatchObject({ ok: false });
    });

    expect(spies.onClose).not.toHaveBeenCalled();
  });

  it('answers neither yes, no nor save while the sheet is closed', async () => {
    const { registry, spies } = harness(false);

    await act(async () => {
      await expect(registry.run(AssistantAction.Confirm)).resolves.toMatchObject({ ok: false });
      await expect(registry.run(AssistantAction.Save)).resolves.toMatchObject({ ok: false });
    });

    expect(spies.onSaveDraftAndExit).not.toHaveBeenCalled();
    expect(spies.onDiscardAndExit).not.toHaveBeenCalled();
  });
});
