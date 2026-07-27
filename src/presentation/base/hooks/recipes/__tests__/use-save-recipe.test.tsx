/**
 * Unit tests for the useSaveRecipe shared hook.
 *
 * The hook is wired to three Zustand stores through StoresContext:
 *   - savedRecipesStore  — source of truth for which ids are saved
 *   - favoritesStore     — executes add/remove against the backend
 *   - authStore          — provides the current user id (or null)
 *
 * Strategy: supply hand-crafted Zustand stores (created with `create()` from
 * zustand directly) through a real StoresProvider, then drive the hook via a
 * probe component rendered with react-test-renderer — matching the pattern used
 * by use-recipe-author.test.tsx in the same __tests__ folder.
 *
 * showErrorToast is module-mocked so the tests never touch the toast pipeline
 * and only assert on the store interactions that matter.
 */

import { act } from 'react-test-renderer';
import { create } from 'zustand';
import { UnknownFailure } from '@core/failure';
import { StoresProvider } from '@presentation/bootstrap/stores-context';
import type { Stores } from '@presentation/bootstrap/stores';
import { renderComponent } from '@presentation/base/test-support/render-component';
import { useSaveRecipe } from '@presentation/base/hooks/recipes/use-save-recipe';
import type { UseSaveRecipeResult } from '@presentation/base/hooks/recipes/use-save-recipe-result';
import type { SavedRecipesStoreState } from '@application/recipes/saved/saved-recipes-store-state';
import type { FavoritesStoreState } from '@application/favorites/favorites-store-state';
import type { AuthStoreState } from '@application/auth/auth-store-state';
import { AuthSessionEntity } from '@domain/auth/auth-session-entity';
import { UserEntity } from '@domain/auth/user-entity';
import { Email } from '@domain/common/email';
import { showErrorToast } from '@presentation/base/feedback/show-toast';

// ─── module mock — keep toast side-effects out of these unit tests ────────────
jest.mock('@presentation/base/feedback/show-toast', () => ({
  showErrorToast: jest.fn(),
}));

// ─── helpers ─────────────────────────────────────────────────────────────────

/** Builds a savedRecipesStore whose savedIds can be seeded and mutated. */
const makeSavedRecipesStore = (initial: Set<string> = new Set()) =>
  create<SavedRecipesStoreState>((set, get) => ({
    savedRecipes: [],
    savedIds: initial,
    isLoading: false,
    error: null,
    has: (id) => get().savedIds.has(id),
    toggle: (id) =>
      set((s) => {
        const next = new Set(s.savedIds);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return { savedIds: next };
      }),
    addLocal: (id) =>
      set((s) => {
        const next = new Set(s.savedIds);
        next.add(id);
        return { savedIds: next };
      }),
    removeLocal: (id) =>
      set((s) => {
        const next = new Set(s.savedIds);
        next.delete(id);
        return { savedIds: next };
      }),
    setSaved: (): void => undefined,
    setLoading: (loading) => set({ isLoading: loading }),
    setError: (error) => set({ error }),
    clearError: () => set({ error: null }),
  }));

interface FavoritesStoreOptions {
  isLoading?: boolean;
  error?: FavoritesStoreState['error'];
  addFavorite?: jest.Mock;
  removeFavorite?: jest.Mock;
}

/** Builds a minimal favoritesStore with controllable isLoading / addFavorite / removeFavorite. */
const makeFavoritesStore = ({
  isLoading = false,
  error = null,
  addFavorite = jest.fn().mockResolvedValue(undefined),
  removeFavorite = jest.fn().mockResolvedValue(undefined),
}: FavoritesStoreOptions = {}) =>
  create<FavoritesStoreState>((set) => ({
    isLoading,
    error,
    addFavorite,
    removeFavorite,
    clearError: () => set({ error: null }),
  }));

/** Unwraps a domain `Result`, throwing in-test if construction unexpectedly fails. */
const unwrap = <T,>(result: { ok: boolean; value?: T }): T => {
  if (!result.ok || result.value === undefined) {
    throw new Error('Test fixture construction failed');
  }
  return result.value;
};

/** Builds a real authenticated `AuthSessionEntity` whose user carries the given id. */
const buildSession = (userId: string): AuthSessionEntity => {
  const email = unwrap(Email.create('test@example.com'));
  const user = unwrap(UserEntity.create({ id: userId, email, displayName: 'Test User' }));
  return unwrap(
    AuthSessionEntity.create({
      id: 'session-1',
      accessToken: 'access-token',
      expiresAt: new Date(Date.now() + 3_600_000),
      user,
    }),
  );
};

/** Builds an authStore that returns the given userId (null = unauthenticated). */
const makeAuthStore = (userId: string | null) =>
  create<AuthStoreState>(() => ({
    state:
      userId !== null
        ? { status: 'authenticated', session: buildSession(userId) }
        : { status: 'unauthenticated' },
    // Unused action stubs — the hook only reads `state`
    signIn: jest.fn(),
    register: jest.fn(),
    verifyRegistration: jest.fn(),
    resendRegistrationCode: jest.fn(),
    signOut: jest.fn(),
    expireSession: jest.fn(),
    hydrate: jest.fn(),
    signInWithGoogle: jest.fn(),
    signInWithApple: jest.fn(),
    requestPasswordReset: jest.fn(),
    resetPassword: jest.fn(),
    uploadAvatar: jest.fn(),
    updateProfile: jest.fn(),
    deleteAccount: jest.fn(),
  }));

interface HarnessOptions {
  savedIds?: Set<string>;
  userId?: string | null;
  favoritesOptions?: FavoritesStoreOptions;
}

/**
 * Renders a probe component that captures the latest UseSaveRecipeResult, then
 * returns the stores and a getter for the live hook output so assertions can
 * inspect both the returned API and the underlying store mutations.
 */
const driveHook = (opts: HarnessOptions = {}): {
  latest: () => UseSaveRecipeResult;
  savedRecipesStore: ReturnType<typeof makeSavedRecipesStore>;
  favoritesStore: ReturnType<typeof makeFavoritesStore>;
} => {
  const { savedIds = new Set<string>(), userId = 'user-1', favoritesOptions = {} } = opts;

  const savedRecipesStore = makeSavedRecipesStore(new Set(savedIds));
  const favoritesStore = makeFavoritesStore(favoritesOptions);
  const authStore = makeAuthStore(userId);

  const stores = {
    savedRecipesStore,
    favoritesStore,
    authStore,
  } as unknown as Stores;

  let latest: UseSaveRecipeResult = { isSaved: () => false, toggleSave: async () => {} };

  const Probe = (): null => {
    latest = useSaveRecipe();
    return null;
  };

  renderComponent(
    <StoresProvider value={stores}>
      <Probe />
    </StoresProvider>,
  );

  return { latest: () => latest, savedRecipesStore, favoritesStore };
};

afterEach(() => {
  jest.clearAllMocks();
});

// ─── isSaved ─────────────────────────────────────────────────────────────────

describe('useSaveRecipe — isSaved', () => {
  it('returns false for a recipe id that is not in savedIds', () => {
    const { latest } = driveHook({ savedIds: new Set(['recipe-A']) });

    expect(latest().isSaved('recipe-B')).toBe(false);
  });

  it('returns true for a recipe id that is present in savedIds', () => {
    const { latest } = driveHook({ savedIds: new Set(['recipe-A']) });

    expect(latest().isSaved('recipe-A')).toBe(true);
  });

  it('reflects a live store update — becomes true after the id is added', async () => {
    const { latest, savedRecipesStore } = driveHook({ savedIds: new Set<string>() });

    expect(latest().isSaved('recipe-X')).toBe(false);

    await act(async () => {
      savedRecipesStore.getState().addLocal('recipe-X');
    });

    expect(latest().isSaved('recipe-X')).toBe(true);
  });
});

// ─── toggleSave — add path ────────────────────────────────────────────────────

describe('useSaveRecipe — toggleSave (add path)', () => {
  it('calls addFavorite(userId, recipeId) when the recipe is NOT in savedIds', async () => {
    const addFavorite = jest.fn().mockResolvedValue(undefined);
    const { latest } = driveHook({
      savedIds: new Set<string>(),
      userId: 'user-42',
      favoritesOptions: { addFavorite },
    });

    await act(async () => {
      await latest().toggleSave('recipe-new');
    });

    expect(addFavorite).toHaveBeenCalledTimes(1);
    expect(addFavorite).toHaveBeenCalledWith('user-42', 'recipe-new');
  });

  it('does NOT call removeFavorite when adding', async () => {
    const removeFavorite = jest.fn().mockResolvedValue(undefined);
    const { latest } = driveHook({
      savedIds: new Set<string>(),
      favoritesOptions: { removeFavorite },
    });

    await act(async () => {
      await latest().toggleSave('recipe-new');
    });

    expect(removeFavorite).not.toHaveBeenCalled();
  });
});

// ─── toggleSave — remove path ─────────────────────────────────────────────────

describe('useSaveRecipe — toggleSave (remove path)', () => {
  it('calls removeFavorite(userId, recipeId) when the recipe IS in savedIds', async () => {
    const removeFavorite = jest.fn().mockResolvedValue(undefined);
    const { latest } = driveHook({
      savedIds: new Set(['recipe-saved']),
      userId: 'user-7',
      favoritesOptions: { removeFavorite },
    });

    await act(async () => {
      await latest().toggleSave('recipe-saved');
    });

    expect(removeFavorite).toHaveBeenCalledTimes(1);
    expect(removeFavorite).toHaveBeenCalledWith('user-7', 'recipe-saved');
  });

  it('does NOT call addFavorite when removing', async () => {
    const addFavorite = jest.fn().mockResolvedValue(undefined);
    const { latest } = driveHook({
      savedIds: new Set(['recipe-saved']),
      favoritesOptions: { addFavorite },
    });

    await act(async () => {
      await latest().toggleSave('recipe-saved');
    });

    expect(addFavorite).not.toHaveBeenCalled();
  });
});

// ─── toggleSave — no-op guards ───────────────────────────────────────────────

describe('useSaveRecipe — toggleSave no-op guards', () => {
  it('is a no-op when userId is null (unauthenticated user)', async () => {
    const addFavorite = jest.fn().mockResolvedValue(undefined);
    const removeFavorite = jest.fn().mockResolvedValue(undefined);
    const { latest } = driveHook({
      userId: null,
      favoritesOptions: { addFavorite, removeFavorite },
    });

    await act(async () => {
      await latest().toggleSave('recipe-A');
    });

    expect(addFavorite).not.toHaveBeenCalled();
    expect(removeFavorite).not.toHaveBeenCalled();
  });

  it('is a no-op when a request is already in flight (isLoading = true)', async () => {
    const addFavorite = jest.fn().mockResolvedValue(undefined);
    const removeFavorite = jest.fn().mockResolvedValue(undefined);
    const { latest } = driveHook({
      savedIds: new Set<string>(),
      favoritesOptions: { isLoading: true, addFavorite, removeFavorite },
    });

    await act(async () => {
      await latest().toggleSave('recipe-B');
    });

    expect(addFavorite).not.toHaveBeenCalled();
    expect(removeFavorite).not.toHaveBeenCalled();
  });

  it('does not call the store twice when toggleSave is called concurrently (no duplicate calls)', async () => {
    // Each call reads isLoading from getState() before proceeding. After the
    // first call sets isLoading: true inside the real store, a second synchronous
    // call on the same tick will see isLoading: true and bail out. We simulate
    // this by using a real add implementation that sets the flag before yielding.
    let resolveFirst!: () => void;
    const firstPending = new Promise<void>((res) => {
      resolveFirst = res;
    });

    let callCount = 0;
    const addFavorite = jest.fn().mockImplementation(async () => {
      callCount += 1;
      await firstPending;
    });

    // Build a favoritesStore whose isLoading is controlled manually so the
    // second toggleSave sees the guard immediately.
    const favoritesStore = makeFavoritesStore({ addFavorite, isLoading: false });

    // Set isLoading to true after the first call starts so the second is blocked.
    const originalAdd = favoritesStore.getState().addFavorite;
    favoritesStore.setState({
      addFavorite: async (userId: string, recipeId: string) => {
        favoritesStore.setState({ isLoading: true });
        await originalAdd(userId, recipeId);
        favoritesStore.setState({ isLoading: false });
      },
    });

    const savedRecipesStore = makeSavedRecipesStore(new Set<string>());
    const authStore = makeAuthStore('user-1');
    const stores = { savedRecipesStore, favoritesStore, authStore } as unknown as Stores;

    let latestResult: UseSaveRecipeResult = { isSaved: () => false, toggleSave: async () => {} };
    const Probe = (): null => {
      latestResult = useSaveRecipe();
      return null;
    };

    renderComponent(
      <StoresProvider value={stores}>
        <Probe />
      </StoresProvider>,
    );

    // Fire first toggleSave — it will set isLoading: true synchronously before
    // awaiting the pending promise.
    const firstCall = latestResult.toggleSave('recipe-C');

    // Fire second toggleSave while the first is in flight.
    await act(async () => {
      await latestResult.toggleSave('recipe-C');
    });

    // Resolve the first call and wait for it to complete.
    resolveFirst();
    await act(async () => {
      await firstCall;
    });

    // The underlying addFavorite implementation should have been invoked exactly
    // once — the second toggleSave bailed out due to the isLoading guard.
    expect(callCount).toBe(1);
  });
});

// ─── error path — toast ──────────────────────────────────────────────────────

describe('useSaveRecipe — error handling', () => {
  it('calls showErrorToast and clearError when the store has an error after toggleSave', async () => {
    const failure = new UnknownFailure('network blip');

    // After addFavorite resolves, the store has an error set (simulating the
    // real favoritesStore behaviour where the use case returns a failure).
    const favoritesStore = makeFavoritesStore({
      addFavorite: jest.fn().mockImplementation(async () => {
        favoritesStore.setState({ error: failure });
      }),
    });

    const savedRecipesStore = makeSavedRecipesStore(new Set<string>());
    const authStore = makeAuthStore('user-1');
    const stores = { savedRecipesStore, favoritesStore, authStore } as unknown as Stores;

    let latestResult: UseSaveRecipeResult = { isSaved: () => false, toggleSave: async () => {} };
    const Probe = (): null => {
      latestResult = useSaveRecipe();
      return null;
    };

    renderComponent(
      <StoresProvider value={stores}>
        <Probe />
      </StoresProvider>,
    );

    await act(async () => {
      await latestResult.toggleSave('recipe-err');
    });

    expect(showErrorToast).toHaveBeenCalledWith(failure);
    // clearError leaves the store error as null after the toast
    expect(favoritesStore.getState().error).toBeNull();
  });

  it('does NOT call showErrorToast when addFavorite completes without an error', async () => {
    const { latest } = driveHook({ savedIds: new Set<string>() });

    await act(async () => {
      await latest().toggleSave('recipe-ok');
    });

    expect(showErrorToast).not.toHaveBeenCalled();
  });
});
