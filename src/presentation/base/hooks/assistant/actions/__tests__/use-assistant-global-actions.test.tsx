import { AssistantAction } from '@domain/assistant/actions/assistant-action-type';
import { AssistantActionRegistry } from '@application/assistant/actions/assistant-action-registry';
import { renderComponent } from '@presentation/base/test-support/render-component';
import { StoresProvider } from '@presentation/bootstrap/stores-context';
import type { Stores } from '@presentation/bootstrap/stores';
import { useAssistantGlobalActions } from '@presentation/base/hooks/assistant/actions/use-assistant-global-actions';
import { router } from 'expo-router';
import { RoutePaths } from '@presentation/base/constants/route-paths';

/**
 * `readScreen` is registered once, beside the pill, and answers for whichever
 * screen is innermost — which is what makes "bu sayfada ne var" a question
 * every screen in the app can answer.
 *
 * Before it existed the model had no word for it at all: it reached into the
 * recipe vocabulary, was told the recipe actions were unavailable on a draft,
 * and told the user to go and open the thing they were looking at.
 */

jest.mock('expo-router', () => ({
  router: { navigate: jest.fn(), push: jest.fn(), back: jest.fn(), canGoBack: () => true },
}));

function harness() {
  const registry = new AssistantActionRegistry();
  const stores = {
    assistantActionRegistry: registry,
    assistantSessionStore: (select: (state: unknown) => unknown) =>
      select({ stopVoice: jest.fn() }),
    recipeListStore: { getState: () => ({ state: { status: 'idle' } }) },
  } as unknown as Stores;

  const Probe = (): null => {
    useAssistantGlobalActions();
    return null;
  };

  renderComponent(
    <StoresProvider value={stores}>
      <Probe />
    </StoresProvider>,
  );

  return registry;
}

describe('readScreen', () => {
  it('reads the screen the user is actually on', async () => {
    const registry = harness();
    registry.registerScreenReading(() => 'draft=Mercimek; ingredients: 1) mercimek');

    await expect(registry.run(AssistantAction.ReadScreen)).resolves.toMatchObject({
      ok: true,
      title: 'draft=Mercimek; ingredients: 1) mercimek',
    });
  });

  // A form or a wait screen registers no reading. Naming the route is still an
  // answer; `unavailable_here` is what sent the model looking for an
  // explanation to make up.
  it('answers with the route when the screen offers no reading', async () => {
    const registry = harness();
    registry.setScreenDescriber(() => 'screen=/settings');

    await expect(registry.run(AssistantAction.ReadScreen)).resolves.toMatchObject({
      ok: true,
      title: 'screen=/settings',
    });
  });

  it('is answerable from every screen, so it never says unavailable_here', async () => {
    const registry = harness();

    await expect(registry.run(AssistantAction.ReadScreen)).resolves.toMatchObject({ ok: true });
  });
});

/**
 * Verified on production: asked "open my recipes" through Siri, the Groq
 * fallback answered `navigate` with "My Recipes" — the label, not the key — and
 * the app came forward only to refuse it as `unknown_screen`.
 */
describe('navigate — the words a model actually sends', () => {
  beforeEach(() => {
    (router.navigate as jest.Mock).mockClear();
  });

  it('opens My Recipes when the model names it by its label', async () => {
    const registry = harness();

    await expect(registry.run(AssistantAction.Navigate, 'My Recipes')).resolves.toEqual({ ok: true });
    expect(router.navigate).toHaveBeenCalledWith(RoutePaths.myRecipes);
  });

  it('refuses an outside page by name, however it is spelled', async () => {
    const registry = harness();

    await expect(registry.run(AssistantAction.Navigate, 'Privacy Policy')).resolves.toMatchObject({
      ok: false,
      error: 'leaves_the_app',
    });
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('still refuses a word that names no screen', async () => {
    const registry = harness();

    await expect(registry.run(AssistantAction.Navigate, 'Tariflerim')).resolves.toMatchObject({
      ok: false,
      error: 'unknown_screen',
    });
  });
});
