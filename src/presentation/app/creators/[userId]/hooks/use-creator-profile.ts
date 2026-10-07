import { useCallback, useState } from 'react';
import { type Href, useFocusEffect, useLocalSearchParams, usePathname, useRouter } from 'expo-router';
import { StoreStatus } from '@application/store/store-status';
import { loadedItems } from '@application/store/paging/loaded-items';
import { CharConstants, ValueConstants } from '@core/constants';
import { isString } from '@core/guards/type-guards';
import { useStores } from '@presentation/bootstrap/use-stores';
import { RoutePaths } from '@presentation/base/constants';
import { useLayout } from '@presentation/base/responsive/use-layout';
import { autoFillColumns } from '@presentation/base/widgets/creators/auto-fill-columns';
import { WEB_CONTENT_MAX_WIDTH } from '@presentation/base/responsive/breakpoints';
import { useSaveRecipe } from '@presentation/base/hooks/recipes/use-save-recipe';
import { useGuestGate } from '@presentation/base/hooks/auth/use-guest-gate';
import { showErrorToast } from '@presentation/base/feedback/show-toast';
import { getLocale, t } from '@presentation/i18n';
import { useCreatorsBack } from '@presentation/app/creators/[userId]/hooks/use-creators-back';
import { useShareCreator } from '@presentation/app/creators/[userId]/hooks/use-share-creator';
import { formatCompactCount } from '@presentation/base/utils/format-compact-count';
import { CreatorProfileMetrics } from '@presentation/app/creators/[userId]/model/creator-profile-metrics';
import type { UseCreatorProfileResult } from '@presentation/app/creators/[userId]/model/use-creator-profile-result';

/**
 * Orchestrates /creators/[userId]: opens the creator in the profile store on
 * every focus, and wires follow, share, paging and the guest gate.
 *
 * @remarks
 * - **Every focus re-opens the page.** The store re-reads quietly for the user
 *   already shown, so a guest who signs in from the follow prompt comes back
 *   to a button that knows whether they follow.
 * - **A guest's Follow opens the sign-in prompt**, which returns here after
 *   sign-in through the login redirect.
 * - **No follow button on one's own page**; the server refuses a self-follow.
 * - **Two tiles across on a phone; on an expanded viewport as many 270-wide
 *   web cards as fit**, each with its save toggle (guests are asked to sign in).
 */
export const useCreatorProfile = (): UseCreatorProfileResult => {
  const router = useRouter();
  const pathname = usePathname();
  const onBack = useCreatorsBack();
  const share = useShareCreator();
  const { isExpanded, width } = useLayout();
  const { isSaved, toggleSave } = useSaveRecipe();
  const params = useLocalSearchParams<{ userId: string }>();
  const userId = isString(params.userId) ? params.userId : CharConstants.empty;

  const { creatorProfileStore, authStore } = useStores();
  const profileState = creatorProfileStore((s) => s.profileState);
  const recipesState = creatorProfileStore((s) => s.recipes);
  const isFollowPending = creatorProfileStore((s) => s.isFollowPending);
  const open = creatorProfileStore((s) => s.open);
  const refresh = creatorProfileStore((s) => s.refresh);
  const loadMoreRecipes = creatorProfileStore((s) => s.loadMoreRecipes);
  const toggleFollow = creatorProfileStore((s) => s.toggleFollow);
  const viewerId = authStore((s) => (s.state.status === StoreStatus.Authenticated ? s.state.session.user.id : null));
  const { promptVisible, promptMessage, requestGate, closePrompt } = useGuestGate(viewerId);
  const [isPullRefreshing, setPullRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (userId !== CharConstants.empty) void open(userId);
    }, [open, userId]),
  );

  const { gutter, gapExpanded, minCardWidthExpanded, phoneColumns } = CreatorProfileMetrics;
  const contentWidth = Math.min(width, WEB_CONTENT_MAX_WIDTH.creatorProfile) - gutter * ValueConstants.two;
  const gridColumns = isExpanded
    ? autoFillColumns(contentWidth, minCardWidthExpanded, gapExpanded, phoneColumns)
    : phoneColumns;

  const follow = (): void => {
    void toggleFollow().then((failure) => {
      if (failure !== null) showErrorToast(failure);
    });
  };

  return {
    profileState,
    recipes: loadedItems(recipesState),
    recipesState,
    isOwnProfile: viewerId !== null && viewerId === userId,
    isFollowPending,
    isPullRefreshing,
    gridColumns,
    isSaved,
    onToggleSave: (id) => requestGate(() => void toggleSave(id), t().recipes.signInToSave),
    formatCount: (value) => formatCompactCount(value, getLocale()),
    onRefresh: () => {
      setPullRefreshing(true);
      void refresh().finally(() => setPullRefreshing(false));
    },
    onEndReached: () => void loadMoreRecipes(),
    onToggleFollow: () => requestGate(follow, t().creators.signInToFollow),
    onShare: () => {
      if (profileState.status === StoreStatus.Loaded) share(userId, profileState.viewed.profile.displayName);
    },
    onOpenRecipe: (id) => router.push(RoutePaths.recipeDetail(encodeURIComponent(id)) as Href),
    onBack,
    promptVisible,
    promptMessage,
    onClosePrompt: closePrompt,
    onGoToSignIn: () => {
      closePrompt();
      router.push(RoutePaths.loginWithRedirect(pathname) as Href);
    },
  };
};
