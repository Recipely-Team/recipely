interface Published {
  calls: { id: string; title: string; subtitle: string | null }[][];
  isAvailable: boolean;
}

const mockState = {
  saved: [] as { id: string; name: string; cuisine: string }[],
  created: [] as { id: string; name: string; cuisine: string }[],
  signedIn: true,
  published: { calls: [], isAvailable: true } as Published,
};

jest.mock('@presentation/bootstrap/use-stores', () => ({
  useStores: () => ({
    osAssistant: {
      get isAvailable() {
        return mockState.published.isAvailable;
      },
      publishRecipes: async (handles: unknown[]) => {
        mockState.published.calls.push(handles as never);
      },
    },
    savedRecipesStore: (select: (s: unknown) => unknown) => select({ savedRecipes: mockState.saved }),
    createdRecipesStore: (select: (s: unknown) => unknown) => select({ recipes: mockState.created }),
    authStore: (select: (s: unknown) => unknown) =>
      select({
        // The literals are spelled out rather than read from `StoreStatus`:
        // babel hoists `jest.mock` above the imports, so anything the factory
        // names from module scope is still uninitialised when it runs. If these
        // two words ever change, this test fails loudly rather than quietly
        // reporting everyone as signed out.
        state: { status: mockState.signedIn ? 'authenticated' : 'unauthenticated' },
      }),
  }),
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { useOsEntityCatalogueSync } = require('@presentation/base/hooks/assistant/os/use-os-entity-catalogue-sync') as typeof import('@presentation/base/hooks/assistant/os/use-os-entity-catalogue-sync');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { createElement } = require('react') as typeof import('react');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { act, create } = require('react-test-renderer') as typeof import('react-test-renderer');

const recipe = (id: string, name: string, cuisine = 'Turkish') => ({ id, name, cuisine });

const Probe = (): null => {
  useOsEntityCatalogueSync();
  return null;
};

const render = async (): Promise<void> => {
  await act(async () => {
    create(createElement(Probe));
  });
};

beforeEach(() => {
  mockState.saved = [];
  mockState.created = [];
  mockState.signedIn = true;
  mockState.published = { calls: [], isAvailable: true };
});

describe('useOsEntityCatalogueSync — what the OS may resolve by name', () => {
  it('publishes saved recipes before created ones', async () => {
    mockState.saved = [recipe('s1', 'Mercimek çorbası')];
    mockState.created = [recipe('c1', 'Köfte')];

    await render();

    expect(mockState.published.calls.at(-1)?.map((handle) => handle.id)).toEqual(['s1', 'c1']);
  });

  // A recipe the user both created and saved is one recipe. Published twice it
  // would take two of the handful of shortcut slots Android allows, and read
  // out as a duplicate in Spotlight.
  it('names a recipe that is both saved and created only once', async () => {
    mockState.saved = [recipe('r1', 'Köfte')];
    mockState.created = [recipe('r1', 'Köfte')];

    await render();

    expect(mockState.published.calls.at(-1)).toHaveLength(1);
  });

  it('carries the cuisine as a subtitle, and nothing when there is none', async () => {
    mockState.saved = [recipe('s1', 'Köfte'), recipe('s2', 'Salata', '')];

    await render();

    expect(mockState.published.calls.at(-1)).toEqual([
      { id: 's1', title: 'Köfte', subtitle: 'Turkish' },
      { id: 's2', title: 'Salata', subtitle: null },
    ]);
  });

  it('stops at the catalogue limit', async () => {
    mockState.saved = Array.from({ length: 40 }, (_, index) => recipe(`s${index}`, `Recipe ${index}`));

    await render();

    expect(mockState.published.calls.at(-1)).toHaveLength(24);
  });
});

describe('useOsEntityCatalogueSync — what must not survive a session', () => {
  // The catalogue lives in the shared container, which outlives the session.
  // Left behind, the next person to hold the phone reads the previous one's
  // recipe titles out of Spotlight.
  it('publishes nothing at all once the user is signed out', async () => {
    mockState.saved = [recipe('s1', 'Mercimek çorbası')];
    mockState.signedIn = false;

    await render();

    expect(mockState.published.calls.at(-1)).toEqual([]);
  });

  it('does not write when there is no OS assistant to write to', async () => {
    mockState.published.isAvailable = false;
    mockState.saved = [recipe('s1', 'Köfte')];

    await render();

    expect(mockState.published.calls).toEqual([]);
  });
});
