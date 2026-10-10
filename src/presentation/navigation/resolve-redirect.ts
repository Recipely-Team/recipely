import { RoutePaths } from '@presentation/base/constants';
import { isString } from '@core/guards/type-guards';
import { CharConstants, RegexConstants, ValueConstants } from '@core/constants';

/**
 * Resolves the post-login redirect target from the `redirect` search param.
 * Accepts the value only when it is an internal absolute path — starts with
 * `/`, is not protocol-relative (`//`), and is not the login route itself
 * (`/login` or `/login?...`, which would loop). Falls back to `/recipes` for
 * any unsafe or absent value.
 *
 * @remarks
 * - **Every way into the app honours it**: login, and the register →
 *   verify-code path a guest takes from "Sign up" on the login screen, which
 *   used to drop it and land on the feed instead of the recipe they wanted.
 */
export const resolveRedirect = (redirect: string | string[] | undefined): string => {
  if (
    isString(redirect) &&
    redirect.startsWith('/') &&
    !redirect.startsWith('//') &&
    !RegexConstants.unsafeRedirectChar.test(redirect) &&
    !RegexConstants.encodedSlash.test(redirect.split(RegexConstants.queryOrFragmentStart, ValueConstants.one)[ValueConstants.zero] ?? CharConstants.empty) &&
    redirect !== RoutePaths.login &&
    !redirect.startsWith(`${RoutePaths.login}?`)
  ) {
    return redirect;
  }
  return RoutePaths.recipes;
};
