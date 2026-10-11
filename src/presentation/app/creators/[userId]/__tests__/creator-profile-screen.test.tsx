/**
 * CreatorProfileScreen — the follow button over the real creator profile
 * store: a signed-in viewer follows and unfollows (the count moves with it), a
 * guest gets the sign-in prompt instead of a request, and nobody is offered
 * to follow themselves.
 */
import { act, type ReactTestInstance } from 'react-test-renderer';
import { ok } from '@core/result/result-helpers';
import { Email } from '@domain/common/email';
import { UserEntity } from '@domain/auth/user-entity';
import { configureCreatorProfileStore } from '@application/creators/profile/creator-profile-store';
import { GetViewedUserProfileUseCase } from '@application/user-profile/get-viewed-user-profile-use-case';
import { ListUserRecipesUseCase } from '@application/user-profile/recipes/list-user-recipes-use-case';
import { SetFollowingUseCase } from '@application/user-profile/follow/set-following-use-case';
import { FakeUserProfileRepository } from '@application/__fixtures__/fake-user-profile-repository';
import { recipePageOf } from '@application/__fixtures__/recipe-page-of';
import { viewedProfileOf } from '@application/__fixtures__/viewed-profile-of';
import { renderComponent, textContent } from '@presentation/base/test-support/render-component';
import { authStoreOf } from '@presentation/base/test-support/auth-store-of';
import { SignInPromptSheet } from '@presentation/base/widgets/sheets/sign-in-prompt-sheet';
import { CreatorProfileScreen } from '@presentation/app/creators/[userId]';
import { t } from '@presentation/i18n';
import { upperCase } from '@presentation/i18n/upper-case';
import { create } from 'zustand';
import type { SavedRecipesStoreState } from '@application/recipes/saved/saved-recipes-store-state';
import type { ApplicationStores } from '@application/di/application-stores';

/** The saved set the web cards' bookmarks read; empty, since these tests are about following. */
const savedStores = (): Partial<ApplicationStores> =>
  ({
    savedRecipesStore: create<Pick<SavedRecipesStoreState, 'savedIds'>>(() => ({ savedIds: new Set<string>() })),
    favoritesStore: create(() => ({ isLoading: false, pending: new Set<string>(), error: null })),
  }) as unknown as Partial<ApplicationStores>;

const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush, back: jest.fn(), replace: jest.fn(), canGoBack: () => true }),
  usePathname: () => '/creators/u-1',
  useLocalSearchParams: () => ({ userId: 'u-1' }),
  useFocusEffect: (callback: () => void) => {
    jest.requireActual<typeof import('react')>('react').useEffect(callback, [callback]);
  },
}));

const userOf = (id: string): UserEntity => {
  const email = Email.create('cook@example.com');
  if (!email.ok) throw new Error('fixture email invalid');
  const user = UserEntity.create({ id, email: email.value, displayName: 'Viewer' });
  if (!user.ok) throw new Error('fixture user invalid');
  return user.value;
};

const renderScreen = async (viewer: UserEntity | null, standing: { followerCount: number; isFollowedByMe: boolean }) => {
  const repo = new FakeUserProfileRepository();
  repo.viewedAnswers = [ok(viewedProfileOf('u-1', standing))];
  repo.recipeAnswers = [ok(recipePageOf([]))];
  const creatorProfileStore = configureCreatorProfileStore({
    getViewedProfile: new GetViewedUserProfileUseCase(repo),
    listUserRecipes: new ListUserRecipesUseCase(repo),
    setFollowing: new SetFollowingUseCase(repo),
  });
  const rendered = renderComponent(<CreatorProfileScreen />, { ...savedStores(), creatorProfileStore, authStore: authStoreOf(viewer) });
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
  return { ...rendered, repo };
};

const followButton = (root: ReactTestInstance): ReactTestInstance =>
  root.find(
    (node) =>
      node.props.accessibilityRole === 'togglebutton' &&
      typeof node.props.accessibilityLabel === 'string' &&
      [t().creators.followName, t().creators.followingName].some((label) => label.replace('{name}', 'Creator u-1') === node.props.accessibilityLabel) &&
      typeof node.props.onPress === 'function',
  );

const press = async (node: ReactTestInstance): Promise<void> => {
  await act(async () => {
    (node.props.onPress as () => void)();
    await Promise.resolve();
    await Promise.resolve();
  });
};

describe('CreatorProfileScreen — follow', () => {
  beforeEach(() => mockPush.mockClear());

  it('shows the creator, the verified handle and the numbers', async () => {
    const { root } = await renderScreen(userOf('viewer'), { followerCount: 12, isFollowedByMe: false });

    expect(textContent(root)).toEqual(expect.arrayContaining(['Creator u-1', '@chef_u_1', upperCase(t().creators.statFollowers)]));
  });

  it('follows for a signed-in viewer and counts them in', async () => {
    const { root, repo } = await renderScreen(userOf('viewer'), { followerCount: 12, isFollowedByMe: false });

    await press(followButton(root));

    expect(repo.followCalls).toEqual(['u-1']);
    expect(textContent(root)).toContain(t().creators.following);
    expect(textContent(root)).toContain('13');
  });

  it('names the creator in the follow button\'s label, in both states', async () => {
    const { root } = await renderScreen(userOf('viewer'), { followerCount: 12, isFollowedByMe: false });

    expect(followButton(root).props.accessibilityLabel).toBe(t().creators.followName.replace('{name}', 'Creator u-1'));
    await press(followButton(root));
    expect(followButton(root).props.accessibilityLabel).toBe(t().creators.followingName.replace('{name}', 'Creator u-1'));
  });

  it('unfollows a creator the viewer already follows', async () => {
    const { root, repo } = await renderScreen(userOf('viewer'), { followerCount: 12, isFollowedByMe: true });

    await press(followButton(root));

    expect(repo.unfollowCalls).toEqual(['u-1']);
    expect(textContent(root)).toContain(t().creators.follow);
  });

  it('asks a guest to sign in instead of following, and the prompt leads to login', async () => {
    const { root, repo } = await renderScreen(null, { followerCount: 12, isFollowedByMe: false });

    await press(followButton(root));

    expect(repo.followCalls).toEqual([]);
    const prompt = root.findByType(SignInPromptSheet);
    expect(prompt.props.visible).toBe(true);
    expect(prompt.props.message).toBe(t().creators.signInToFollow);
    await act(async () => (prompt.props.onSignIn as () => void)());
    expect(mockPush).toHaveBeenCalledWith('/login?redirect=%2Fcreators%2Fu-1');
  });

  it('offers no follow button on the viewer’s own page', async () => {
    const { root } = await renderScreen(userOf('u-1'), { followerCount: 12, isFollowedByMe: false });

    expect(() => followButton(root)).toThrow();
  });
});
