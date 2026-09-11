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

/** A feed that answers a query only when the test says so. */
function fakeRecipeList(initial: unknown = { status: 'idle' }) {
  let state = initial;
  const listeners = new Set<(next: { state: unknown }) => void>();
  return {
    getState: () => ({ state }),
    subscribe: (listener: (next: { state: unknown }) => void) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    answer: (query: string, recipes: { id: string; name: string }[]) => {
      state = { status: 'loaded', query, recipes };
      for (const listener of listeners) listener({ state });
    },
  };
}

function harness(recipeListStore: unknown = fakeRecipeList()) {
  const registry = new AssistantActionRegistry();
  const stores = {
    assistantActionRegistry: registry,
    assistantSessionStore: (select: (state: unknown) => unknown) =>
      select({ stopVoice: jest.fn() }),
    recipeListStore,
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

/**
 * Reported with the list on screen: "tavuk şavurma dedim, bulamadım dedi,
 * ekranda listede vardı." `search` opened the feed with the query and returned
 * at once, so the registry read the screen before the rows arrived and told
 * the model `recipes=none`. The model believed the screen line over the user.
 */
describe('search', () => {
  it('does not answer until the feed has the rows the query asked for', async () => {
    const feed = fakeRecipeList();
    const registry = harness(feed);
    registry.setScreenDescriber(() => {
      const state = feed.getState().state as { status: string; recipes?: { name: string }[] };
      return state.status === 'loaded' && state.recipes !== undefined
        ? `screen=/recipes; recipes=${state.recipes.map((r) => r.name).join(', ')}`
        : 'screen=/recipes; recipes=none';
    });

    const running = registry.run(AssistantAction.Search, 'tavuk şavurma');
    let answered = false;
    void running.then(() => (answered = true));
    await Promise.resolve();
    expect(answered).toBe(false);

    feed.answer('tavuk şavurma', [{ id: 'r1', name: 'Tavuk Şavurma' }]);

    await expect(running).resolves.toMatchObject({
      ok: true,
      ctx: 'screen=/recipes; recipes=Tavuk Şavurma',
    });
    expect(router.navigate).toHaveBeenCalledWith(RoutePaths.recipesWithSearch('tavuk şavurma'));
  });

  it('gives up waiting rather than leaving the assistant silent', async () => {
    jest.useFakeTimers();
    try {
      const registry = harness(fakeRecipeList());

      const running = registry.run(AssistantAction.Search, 'mercimek');
      await jest.advanceTimersByTimeAsync(4_000);

      await expect(running).resolves.toMatchObject({ ok: true });
    } finally {
      jest.useRealTimers();
    }
  });
});

/**
 * Reported: "tavuk şavurma dedim klasik çikolatalı kurabiye tarifini açtı,
 * şakşuka tarifi dedim fıstıklı baklava tarifini açtı." The name was not in the
 * rows the feed happened to be holding, so the handler said `not_found` — and
 * the model answered with a recipe id it remembered from an earlier turn.
 */
describe('openRecipe', () => {
  it('looks for a name the feed is not showing, and opens what it finds', async () => {
    const feed = fakeRecipeList({ status: 'loaded', query: '', recipes: [{ id: 'b1', name: 'Fıstıklı Baklava' }] });
    const registry = harness(feed);

    const running = registry.run(AssistantAction.OpenRecipe, 'şakşuka');
    await Promise.resolve();
    feed.answer('şakşuka', [{ id: 's1', name: 'Şakşuka (Yumurtalı)' }]);

    await expect(running).resolves.toMatchObject({ ok: true, title: 'Şakşuka (Yumurtalı)' });
    expect(router.navigate).toHaveBeenCalledWith(RoutePaths.recipesWithSearch('şakşuka'));
    expect(router.push).toHaveBeenCalledWith(RoutePaths.recipeDetail('s1'));
  });

  it('opens a row the feed already has without searching for it', async () => {
    const feed = fakeRecipeList({ status: 'loaded', query: '', recipes: [{ id: 't1', name: 'Tavuk Şavurma' }] });
    const registry = harness(feed);

    await expect(registry.run(AssistantAction.OpenRecipe, 'tavuk şavurma')).resolves.toMatchObject({
      ok: true,
      title: 'Tavuk Şavurma',
    });
    expect(router.push).toHaveBeenCalledWith(RoutePaths.recipeDetail('t1'));
  });

  it('says it could not find one rather than opening something else', async () => {
    jest.useFakeTimers();
    try {
      const registry = harness(fakeRecipeList({ status: 'loaded', query: '', recipes: [] }));

      const running = registry.run(AssistantAction.OpenRecipe, 'ayran aşı çorbası');
      await jest.advanceTimersByTimeAsync(4_000);

      await expect(running).resolves.toMatchObject({ ok: false, error: 'not_found' });
    } finally {
      jest.useRealTimers();
    }
  });
});
