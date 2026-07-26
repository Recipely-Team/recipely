import { usePathname, useRouter } from 'expo-router';
import type { Href } from 'expo-router';
import type { TabBarKey } from '@presentation/base/widgets/navigation/tab-bar-key';
import { RoutePaths } from '@presentation/base/constants';

/**
 * Paths that show the root TabBar, mapped to the tab they highlight.
 * `/settings` shares the profile tab — it is reached from the profile page
 * and stays inside that section. Paths absent from this map (detail pages,
 * create flows, auth screens, …) render no TabBar at all.
 */
const TAB_BY_PATH = new Map<string, TabBarKey>([
  ['/recipes', 'recipes'],
  ['/my-recipes', 'myRecipes'],
  ['/profile', 'profile'],
  ['/settings', 'profile'],
]);

const PATH_BY_TAB: Readonly<Record<TabBarKey, Href>> = {
  recipes: RoutePaths.recipes,
  myRecipes: RoutePaths.myRecipes,
  profile: RoutePaths.profile,
};

/**
 * Drives the single root-level TabBar (rendered in `app/_layout.tsx`, OUTSIDE
 * the Stack so screen transitions never move it — only the content above it
 * animates). Returns `null` on paths that don't show the bar. Tab presses
 * `replace` rather than `push` so tabs don't pile up in the history stack;
 * pressing the already-active tab is a no-op.
 */
export const useTabBarState = (): {
  active: TabBarKey;
  onChange: (key: TabBarKey) => void;
} | null => {
  const pathname = usePathname();
  const router = useRouter();

  const active = TAB_BY_PATH.get(pathname);
  if (active === undefined) return null;

  const onChange = (key: TabBarKey): void => {
    const target = PATH_BY_TAB[key];
    // No-op only when already ON the target page. Comparing against `active`
    // would be wrong on /settings: it highlights the profile tab, yet pressing
    // Profile there must still navigate back to /profile.
    if (target === pathname) return;
    router.replace(target);
  };

  return { active, onChange };
};
