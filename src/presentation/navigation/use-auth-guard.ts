import { useEffect } from 'react';
import { type Href, usePathname, useRouter } from 'expo-router';
import { useStores } from '@presentation/bootstrap/use-stores';
import { RoutePaths } from '@presentation/base/constants';

/**
 * Routes reachable without an authenticated session. Every other path is gated
 * by {@link useAuthGuard}; auth screens, the index splash, and the browsable
 * recipe list live here. Exact matches only — dynamic public routes (e.g.
 * recipe detail) are matched separately by {@link RECIPE_DETAIL_PATH}.
 *
 * `/recipes` (the list) is public so guests can browse without an account: the
 * backend serves the read-only list, trending, taxonomy, and comment-listing
 * endpoints with optional auth. Account-bound actions on the list/detail
 * screens (favorite, like, comment, create, AI generate) still route the guest
 * to login on tap; only the gated sub-routes — my-recipes, profile, create,
 * settings, notifications, and the AI generator — remain guarded.
 */
export const PUBLIC_PATHS = new Set<string>([
  '/',
  '/onboarding',
  '/login',
  '/register',
  '/verify-code',
  '/forgot-password',
  '/reset-password',
  '/recipes',
]);

/**
 * The single-recipe detail route (`/recipes/:recipeId`) is public — the
 * backend serves `GET /recipes/:id` without auth so guests can view a shared
 * recipe. Matches only exactly one path segment after `/recipes` — the list
 * (`/recipes`, no trailing segment) is public via {@link PUBLIC_PATHS}, while
 * every other `/recipes/*` sub-route stays gated.
 */
const RECIPE_DETAIL_PATH = /^\/recipes\/[^/]+$/;

const isPublicPath = (pathname: string): boolean =>
  PUBLIC_PATHS.has(pathname) || RECIPE_DETAIL_PATH.test(pathname);

/**
 * Redirects to `/login` whenever the session resolves as unauthenticated on a
 * route that requires auth — covers both "never logged in" and "signed out".
 * No-ops while the session is still hydrating (`idle`/`loading`) so a valid
 * session is never bounced on a hard reload / deep link.
 *
 * Public routes are exempt: the exact-match set in {@link PUBLIC_PATHS} plus
 * the recipe-detail dynamic route matched by {@link RECIPE_DETAIL_PATH} (the
 * only `/recipes/*` path that's public — the list, trending, and every
 * mutation endpoint still require auth server-side).
 *
 * When bouncing from a gated path worth returning to (i.e. not `/` and not
 * `/login`), a `redirect` query param is appended so that the login screen
 * can send the user straight back after a successful sign-in, e.g.
 * `/login?redirect=%2Frecipes%2F123`.
 */
export const useAuthGuard = (): void => {
  const { authStore } = useStores();
  const status = authStore((s) => s.state.status);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (status !== 'unauthenticated') return;
    if (isPublicPath(pathname)) return;
    // `pathname` is guaranteed non-public here — the isPublicPath early return
    // above already handled `/`, `/login`, and the other public routes — so it
    // is always worth preserving as a post-login redirect target. Cast: the
    // dynamic redirect param can't be statically verified against expo-router's
    // typed-routes union.
    router.replace(RoutePaths.loginWithRedirect(pathname) as Href);
  }, [status, pathname, router]);
};
