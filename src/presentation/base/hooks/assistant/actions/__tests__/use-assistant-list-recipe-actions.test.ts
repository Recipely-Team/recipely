import { AssistantAction } from '@domain/assistant/actions/assistant-action-type';
import { AssistantActionRegistry } from '@application/assistant/actions/assistant-action-registry';
import { StoreStatus } from '@application/store/store-status';

/**
 * "Save the baklava", said while looking at a list of recipes with a bookmark
 * on every card, answered `unavailable_here`: save and like were registered
 * only by the recipe screen, where there is one recipe and therefore no need
 * for a name. A list is the other half of that — the user is reading rows and
 * refers to one of them.
 *
 * Liking is deliberately not done in place. There is no like control on a
 * card, so a like from the list would be a success the screen could not show —
 * the failure this repo has already recorded once: a handler answering `ok` is
 * not the same as the work having visibly happened.
 */

interface Probe {
  saved: Set<string>;
  toggled: string[];
  pushed: string[];
  signedIn: boolean;
}

const probe = (): Probe => (globalThis as never as { __rows: Probe }).__rows;

jest.mock('expo-router', () => ({
  router: {
    push: (href: string) => {
      (globalThis as never as { __rows: Probe }).__rows.pushed.push(href);
    },
  },
}));

jest.mock('@presentation/base/hooks/recipes/use-save-recipe', () => ({
  useSaveRecipe: () => ({
    isSaved: (id: string) => (globalThis as never as { __rows: Probe }).__rows.saved.has(id),
    toggleSave: async (id: string) => {
      const state = (globalThis as never as { __rows: Probe }).__rows;
      state.toggled.push(id);
      if (state.saved.has(id)) state.saved.delete(id);
      else state.saved.add(id);
    },
  }),
}));

const mockRegistry = new AssistantActionRegistry();
const mockAuth = { in: StoreStatus.Authenticated, out: StoreStatus.Unauthenticated };
jest.mock('@presentation/bootstrap/use-stores', () => ({
  useStores: () => ({
    assistantActionRegistry: mockRegistry,
    authStore: (select: (s: { state: { status: string } }) => unknown) =>
      select({
        state: {
          status: (globalThis as never as { __rows: Probe }).__rows.signedIn
            ? mockAuth.in
            : mockAuth.out,
        },
      }),
  }),
}));
const registry = mockRegistry;

// Imported after the mocks so the hook picks them up.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { useAssistantListRecipeActions } = require('@presentation/base/hooks/assistant/actions/use-assistant-list-recipe-actions') as typeof import('@presentation/base/hooks/assistant/actions/use-assistant-list-recipe-actions');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { createElement } = require('react') as typeof import('react');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { act, create } = require('react-test-renderer') as typeof import('react-test-renderer');

const ROWS = [
  { id: 'r-baklava', name: 'Baklava' },
  { id: 'r-mercimek', name: 'Mercimek Çorbası' },
];

const mount = (rows: { id: string; name: string }[] = ROWS): void => {
  act(() => {
    create(
      createElement(function Host() {
        useAssistantListRecipeActions(rows);
        return null;
      }),
    );
  });
};

beforeEach(() => {
  (globalThis as never as { __rows: Probe }).__rows = {
    saved: new Set<string>(),
    toggled: [],
    pushed: [],
    signedIn: true,
  };
});

describe('useAssistantListRecipeActions', () => {
  it('saves the row the user named', async () => {
    mount();

    await expect(registry.run(AssistantAction.Save, 'baklava')).resolves.toMatchObject({
      ok: true,
      title: 'Baklava',
    });
    expect(probe().saved.has('r-baklava')).toBe(true);
  });

  it('saves the row the user counted to', async () => {
    mount();

    await expect(registry.run(AssistantAction.Save, '2')).resolves.toMatchObject({
      ok: true,
      title: 'Mercimek Çorbası',
    });
    expect(probe().saved.has('r-mercimek')).toBe(true);
  });

  it('treats a recipe that is already saved as saved, rather than un-saving it', async () => {
    probe().saved.add('r-baklava');
    mount();

    await expect(registry.run(AssistantAction.Save, 'baklava')).resolves.toMatchObject({ ok: true });
    // The user asked for an outcome and the outcome holds — toggling here
    // would have removed the very thing they asked to keep.
    expect(probe().toggled).toEqual([]);
  });

  it('passes a name it is not showing to whatever is underneath', async () => {
    mount();

    // `notMine`, not a failure: the recipe screen below may well be showing it.
    await expect(registry.run(AssistantAction.Save, 'karnıyarık')).resolves.toMatchObject({
      ok: false,
    });
    expect(probe().toggled).toEqual([]);
  });

  it('opens the recipe to like it, because a card has nowhere to show a like', async () => {
    mount();

    const answer = registry.run(AssistantAction.Like, 'baklava');
    await Promise.resolve();

    expect(probe().pushed).toEqual(['/recipes/r-baklava']);
    // Nothing registers `like` in this test, so the wait times out and the
    // action reports that rather than claiming a like nobody performed.
    await expect(answer).resolves.toMatchObject({ ok: false });
  }, 10_000);

  it('refuses to save while signed out instead of failing silently', async () => {
    probe().signedIn = false;
    mount();

    await expect(registry.run(AssistantAction.Save, 'baklava')).resolves.toMatchObject({
      ok: false,
      error: 'signed_out',
    });
  });
});
