/* eslint-disable import/first -- jest.mock() must be hoisted above imports */
import type { MyRecipesListProps } from '@presentation/app/my-recipes/body/my-recipes-list';

const mockList: { props: MyRecipesListProps | null } = { props: null };

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
  useFocusEffect: jest.fn(),
  useLocalSearchParams: () => ({ tab: 'drafts' }),
}));
jest.mock('@presentation/app/my-recipes/body/my-recipes-list', () => ({
  MyRecipesList: (props: MyRecipesListProps) => {
    mockList.props = props;
    return null;
  },
}));
jest.mock('@presentation/app/my-recipes/body/my-recipes-header', () => ({ MyRecipesHeader: () => null }));
jest.mock('@presentation/app/my-recipes/body/my-recipes-tabs', () => ({ MyRecipesTabs: () => null }));
jest.mock('@presentation/app/my-recipes/hooks/use-my-recipes-refresh', () => ({
  useMyRecipesRefresh: () => ({ isRefreshing: false, onRefresh: jest.fn() }),
}));
jest.mock('@presentation/base/hooks/recipes/use-save-recipe', () => ({
  useSaveRecipe: () => ({ isSaved: () => false, toggleSave: jest.fn() }),
}));

import { act } from 'react-test-renderer';
import { create } from 'zustand';
import { StoreStatus } from '@application/store/store-status';
import type { ApplicationStores } from '@application/di/application-stores';
import { authStoreOf } from '@presentation/base/test-support/auth-store-of';
import { renderComponent, textContent } from '@presentation/base/test-support/render-component';
import { MyRecipesScreen } from '@presentation/app/my-recipes/index';
import { t } from '@presentation/i18n';

/**
 * Reported as: "I tapped the little bin on a draft and it was gone." The draft
 * row's trash icon deleted on the first tap, while the voice path for the same
 * action asked first — a touch user got less protection than a voice user. The
 * tap now opens the same "Delete this draft?" sheet; the delete waits for yes.
 */
const renderScreen = () => {
  const deleteDraft = jest.fn().mockResolvedValue({ ok: true, value: undefined });
  const idle = { status: StoreStatus.Loaded };
  const stores = {
    authStore: authStoreOf(null),
    likesStore: create(() => ({ byRecipe: {}, setLiked: jest.fn() })),
    favoritesStore: create(() => ({ addFavorite: jest.fn(), removeFavorite: jest.fn() })),
    savedRecipesStore: create(() => ({ savedRecipes: [], listState: idle, savedIds: new Set<string>(), loadSaved: jest.fn() })),
    likedRecipesStore: create(() => ({ likedRecipes: [], listState: idle, loadLiked: jest.fn() })),
    createdRecipesStore: create(() => ({ recipes: [], myRecipesState: idle, loadMyRecipes: jest.fn() })),
    draftsStore: create(() => ({
      drafts: { status: StoreStatus.Loaded, items: [], page: 1, total: 0, hasMore: false, isLoadingMore: false, moreFailure: null },
      loadDrafts: jest.fn(),
      loadMoreDrafts: jest.fn(),
      deleteDraft,
    })),
  } as unknown as Partial<ApplicationStores>;
  const { root } = renderComponent(<MyRecipesScreen />, stores);
  return { root, deleteDraft };
};

describe('My Recipes — deleting a draft by touch', () => {
  it('asks before deleting and deletes nothing on the first tap', () => {
    const { root, deleteDraft } = renderScreen();

    act(() => mockList.props?.onDeleteDraft('d1'));

    expect(deleteDraft).not.toHaveBeenCalled();
    expect(textContent(root)).toContain(t().assistant.deleteDraftMessage);
  });

  it('deletes the draft once the confirm is pressed', async () => {
    const { root, deleteDraft } = renderScreen();

    act(() => mockList.props?.onDeleteDraft('d1'));
    const confirm = root.findAll(
      (node) =>
        node.props.accessibilityRole === 'button' &&
        typeof node.props.onPress === 'function' &&
        textContent(node).includes(t().myRecipes.deleteRecipe),
    )[0];
    await act(async () => (confirm?.props.onPress as () => void)());

    expect(deleteDraft).toHaveBeenCalledWith('d1');
  });
});
