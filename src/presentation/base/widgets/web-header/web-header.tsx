import { StyleSheet, View } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { useStores } from '@presentation/bootstrap/use-stores';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { useWebShellState } from '@presentation/base/web-shell/use-web-shell-state';
import { WEB_CONTENT_MAX_WIDTH } from '@presentation/base/responsive/breakpoints';
import { spacing, zIndices } from '@presentation/base/theme';
import { t, useLocale } from '@presentation/i18n';
import { WebHeaderLogo } from '@presentation/base/widgets/web-header/web-header-logo';
import { WebHeaderTabs } from '@presentation/base/widgets/web-header/web-header-tabs';
import type { WebHeaderTabKey } from '@presentation/base/widgets/web-header/web-header-tab-key';
import { WebHeaderSearch } from '@presentation/base/widgets/web-header/web-header-search';
import { WebHeaderActions } from '@presentation/base/widgets/web-header/web-header-actions';
import { ValueConstants } from '@core/constants';
import { RoutePaths } from '@presentation/base/constants';

const HEADER_HEIGHT = 68;

/**
 * Maps the current pathname to a top-level tab key so sub-pages
 * (e.g. /recipes/[id], /create-recipe) keep the parent tab highlighted.
 */
const resolveActiveTab = (pathname: string): WebHeaderTabKey | null => {
  if (pathname.startsWith('/my-recipes') || pathname.startsWith('/create-recipe')) {
    return 'myRecipes';
  }
  if (pathname.startsWith('/recipes')) return 'recipes';
  return null;
};

const isProfileRoute = (pathname: string): boolean =>
  pathname.startsWith('/profile') || pathname.startsWith('/settings');

/**
 * Sticky desktop chrome that replaces the mobile bottom TabBar and per-screen
 * TopAppBars whenever the LayoutProvider reports `isWebShell === true`. Mounted
 * by the root layout so screens stay platform-agnostic.
 */
export const WebHeader = (): React.JSX.Element => {
  useLocale(); // re-render the persistent header when the language changes
  const router = useRouter();
  const pathname = usePathname();
  const colors = useTheme().colors;
  const { authStore, notificationsStore } = useStores();
  const authState = authStore((s) => s.state);
  const unreadCount = notificationsStore((s) => s.unreadCount);
  const { searchQuery, setSearchQuery } = useWebShellState();

  const activeTab = resolveActiveTab(pathname);
  const isProfileActive = isProfileRoute(pathname);

  const tabs = [
    {
      key: 'recipes' as const,
      label: t().recipes.title,
      icon: 'restaurant-outline' as const,
    },
    {
      key: 'myRecipes' as const,
      label: t().myRecipes.title,
      icon: 'bookmark-outline' as const,
    },
  ];

  const user = authState.status === 'authenticated' ? authState.session.user : null;
  const displayName = user?.displayName ?? 'Recipely User';
  const avatarUri = user?.photoUrl ?? undefined;

  const goRecipes = (): void => router.replace(RoutePaths.recipes);
  const goTab = (key: WebHeaderTabKey): void => {
    if (key === 'recipes') router.replace(RoutePaths.recipes);
    else router.replace(RoutePaths.myRecipes);
  };
  const goCreate = (): void => router.push(RoutePaths.createRecipe);
  const goNotifs = (): void => router.push(RoutePaths.notifications);
  const goProfile = (): void => router.replace(RoutePaths.profile);
  const goDiscover = (): void => router.push(RoutePaths.onboarding);

  // The Discover entry to the welcome/onboarding screen is a guest-only affordance
  // and — per the prototype — lives on the Recipes tab alone.
  const isAuthenticated = authState.status === 'authenticated';
  const showDiscover = activeTab === 'recipes' && !isAuthenticated;

  // Search input only appears on the Recipes listing — that's where the recipe
  // list reads `useWebShellState().searchQuery` and folds it into its filter.
  const showSearch = activeTab === 'recipes';

  return (
    <View
      style={[
        styles.root,
        {
          backgroundColor: colors.background,
          borderBottomColor: colors.cardBorder,
        },
      ]}
    >
      <View style={styles.inner}>
        <WebHeaderLogo onPress={goRecipes} />

        <View style={styles.navWrap}>
          <WebHeaderTabs active={activeTab} tabs={tabs} onPress={goTab} />
        </View>

        <View style={styles.searchWrap}>
          {showSearch ? (
            <WebHeaderSearch
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder={t().recipes.searchPlaceholder}
              ariaLabel={t().recipes.searchPlaceholder}
              ariaClear={t().common.clear}
            />
          ) : null}
        </View>

        <WebHeaderActions
          createLabel={t().myRecipes.createNew}
          notificationsLabel={t().notifications.title}
          profileLabel={t().navigation.profile}
          unreadCount={unreadCount}
          isProfileActive={isProfileActive}
          avatarName={displayName}
          avatarUri={avatarUri}
          discoverLabel={showDiscover ? t().onboarding.discover : undefined}
          onCreate={goCreate}
          onOpenNotifications={goNotifs}
          onOpenProfile={goProfile}
          onDiscover={showDiscover ? goDiscover : undefined}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    width: '100%',
    borderBottomWidth: StyleSheet.hairlineWidth,
    zIndex: zIndices.appHeader,
  },
  inner: {
    width: '100%',
    maxWidth: WEB_CONTENT_MAX_WIDTH.default,
    alignSelf: 'center',
    height: HEADER_HEIGHT,
    paddingHorizontal: spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xl,
  },
  navWrap: {
    height: '100%',
    justifyContent: 'center',
  },
  searchWrap: {
    flex: ValueConstants.one,
    minWidth: ValueConstants.zero,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
