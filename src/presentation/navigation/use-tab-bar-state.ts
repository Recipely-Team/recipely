import { usePathname, useRouter } from 'expo-router';
import type { Href } from 'expo-router';
import { TabBarKey } from '@presentation/base/widgets/navigation/tab-bar-key';
import { RoutePaths } from '@presentation/base/constants';

/**
 * Paths that show the root TabBar, mapped to the tab they highlight.
 * `/settings` shares the profile tab — it is reached from the profile page
 * and stays inside that section. Paths absent from this map (detail pages,
 * create flows, auth screens, …) render no TabBar at all.
 */
const TAB_BY_PATH = new Map<string, TabBarKey>([
  [RoutePaths.recipes, TabBarKey.Recipes],
  [RoutePaths.myRecipes, TabBarKey.MyRecipes],
  [RoutePaths.creators, TabBarKey.Chefs],
  [RoutePaths.diary, TabBarKey.Diary],
  // The month page is pushed inside the Diary tab, so the bar stays and keeps Diary lit.
  [RoutePaths.diaryCalendar, TabBarKey.Diary],
  [RoutePaths.profile, TabBarKey.Profile],
  [RoutePaths.settings, TabBarKey.Profile],
]);

const PATH_BY_TAB: Readonly<Record<TabBarKey, string>> = {
  [TabBarKey.Recipes]: RoutePaths.recipes,
  [TabBarKey.MyRecipes]: RoutePaths.myRecipes,
  [TabBarKey.Chefs]: RoutePaths.creators,
  [TabBarKey.Diary]: RoutePaths.diary,
  [TabBarKey.Profile]: RoutePaths.profile,
};

/** The default opener: straight to the tab, no questions. */
const navigateDirectly = (path: string, navigate: (path: string) => void): void => navigate(path);

/**
 * Drives the single root-level TabBar (rendered in `app/_layout.tsx`, OUTSIDE
 * the Stack so screen transitions never move it — only the content above it
 * animates). Returns `null` on paths that don't show the bar. Tab presses
 * `replace` rather than `push` so tabs don't pile up in the history stack;
 * pressing the already-active tab is a no-op.
 *
 * @remarks
 * - **`open` decides whether a press navigates.** The root bar passes the guest
 *   gate's, so a guest's press on an account tab explains itself instead of
 *   bouncing to login (`useGuestRouteGate`); widgets that only ask whether
 *   the bar is showing pass nothing.
 */
export const useTabBarState = (
  open: (path: string, navigate: (path: string) => void) => void = navigateDirectly,
): {
  active: TabBarKey;
  onChange: (key: TabBarKey) => void;
} | null => {
  const pathname = usePathname();
  const router = useRouter();

  const active = TAB_BY_PATH.get(pathname);
  if (active === undefined) return null;

  const onChange = (key: TabBarKey): void => {
    const target = PATH_BY_TAB[key];
    // Compare with the path, not the active tab (/settings lights Profile but must still navigate).
    if (target === pathname) return;
    // Cast: a RoutePaths string is not in the typed-routes union.
    open(target, (path) => router.replace(path as Href));
  };

  return { active, onChange };
};
