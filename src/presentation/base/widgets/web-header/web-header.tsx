import { StyleSheet, View } from 'react-native';
import { StoreStatus } from '@application/store/store-status';
import { type Href, useRouter, usePathname } from 'expo-router';
import { useGuestRouteGate } from '@presentation/base/hooks/auth/use-guest-route-gate';
import { SignInPromptSheet } from '@presentation/base/widgets/sheets/sign-in-prompt-sheet';
import { useStores } from '@presentation/bootstrap/use-stores';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { useWebShellState } from '@presentation/base/web-shell/use-web-shell-state';
import { WEB_CONTENT_MAX_WIDTH } from '@presentation/base/responsive/breakpoints';
import { spacing, zIndices } from '@presentation/base/theme';
import { t, useLocale } from '@presentation/i18n';
import { WebHeaderLogo } from '@presentation/base/widgets/web-header/web-header-logo';
import { WebHeaderTabs } from '@presentation/base/widgets/web-header/web-header-tabs';
import { WebHeaderTabKey } from '@presentation/base/widgets/web-header/web-header-tab-key';
import type { TabItem } from '@presentation/base/widgets/navigation/tab-item';
import { TabIconFamily } from '@presentation/base/widgets/navigation/tab-icon-family';
import { WebHeaderSearch } from '@presentation/base/widgets/web-header/web-header-search';
import { WebHeaderActions } from '@presentation/base/widgets/web-header/web-header-actions';
import { CharConstants, ValueConstants } from '@core/constants';
import { RoutePaths } from '@presentation/base/constants';

const HEADER_HEIGHT = 68;

/**
 * Maps the current pathname to a top-level tab key so sub-pages
 * (e.g. /recipes/[id], /create-recipe, /creators/[id]) keep the parent tab highlighted.
 */
const resolveActiveTab = (pathname: string): WebHeaderTabKey | null => {
  if (pathname.startsWith(RoutePaths.myRecipes) || pathname.startsWith(RoutePaths.createRecipe)) {
    return WebHeaderTabKey.MyRecipes;
  }
  if (pathname.startsWith(RoutePaths.recipes)) return WebHeaderTabKey.Recipes;
  if (pathname.startsWith(RoutePaths.creators)) return WebHeaderTabKey.Chefs;
  if (pathname.startsWith(RoutePaths.diary)) return WebHeaderTabKey.Diary;
  return null;
};

const isProfileRoute = (pathname: string): boolean =>
  pathname.startsWith(RoutePaths.profile) || pathname.startsWith(RoutePaths.settings);

/**
 * Sticky desktop chrome that replaces the mobile bottom TabBar and per-screen
 * TopAppBars whenever the LayoutProvider reports `isWebShell === true`. Mounted
 * by the root layout so screens stay platform-agnostic.
 *
 * @remarks
 * - **A guest's press on an account page explains itself** — My Recipes, Diary,
 *   the bell and the avatar open the sign-in dialog instead of a bare login form
 *   ({@link useGuestRouteGate}).
 */
export const WebHeader = (): React.JSX.Element => {
  useLocale(); // re-render the persistent header when the language changes
  const router = useRouter();
  const gate = useGuestRouteGate();
  const pathname = usePathname();
  const colors = useTheme().colors;
  const { authStore, notificationsStore } = useStores();
  const authState = authStore((s) => s.state);
  const unreadCount = notificationsStore((s) => s.unreadCount);
  const { searchQuery, setSearchQuery } = useWebShellState();

  const activeTab = resolveActiveTab(pathname);
  const isProfileActive = isProfileRoute(pathname);

  const tabs: TabItem<WebHeaderTabKey>[] = [
    { key: 'recipes', label: t().recipes.title, icon: { family: TabIconFamily.Ionicons, name: 'restaurant-outline' } },
    { key: 'myRecipes', label: t().myRecipes.title, icon: { family: TabIconFamily.Ionicons, name: 'bookmark-outline' } },
    { key: 'chefs', label: t().navigation.chefs, icon: { family: TabIconFamily.Material, name: 'chef-hat' } },
    { key: 'diary', label: t().navigation.diary, icon: { family: TabIconFamily.Ionicons, name: 'calendar-outline' } },
  ];

  const user = authState.status === StoreStatus.Authenticated ? authState.session.user : null;
  // Empty for guests, so the avatar shows the person mark.
  const displayName = user?.displayName ?? CharConstants.empty;
  const avatarUri = user?.photoUrl ?? undefined;

  const goRecipes = (): void => router.replace(RoutePaths.recipes);
  // Cast: a RoutePaths string is not in the typed-routes union.
  const replace = (path: string): void => router.replace(path as Href);
  const goTab = (key: WebHeaderTabKey): void => {
    if (key === WebHeaderTabKey.Recipes) router.replace(RoutePaths.recipes);
    else if (key === WebHeaderTabKey.Diary) gate.open(RoutePaths.diary, replace);
    else if (key === WebHeaderTabKey.Chefs) router.replace(RoutePaths.creators);
    else gate.open(RoutePaths.myRecipes, replace);
  };
  const goCreate = (): void => router.push(RoutePaths.createRecipe);
  const goNotifs = (): void => gate.open(RoutePaths.notifications, (path) => router.push(path as Href));
  const goProfile = (): void => gate.open(RoutePaths.profile, replace);
  const goDiscover = (): void => router.push(RoutePaths.onboarding);

  // Discover is guest-only and on the Recipes tab.
  const isAuthenticated = authState.status === StoreStatus.Authenticated;
  const showDiscover = activeTab === WebHeaderTabKey.Recipes && !isAuthenticated;

  // Search only on the Recipes listing, which reads it.
  const showSearch = activeTab === WebHeaderTabKey.Recipes;

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
      <SignInPromptSheet {...gate.prompt} />
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
