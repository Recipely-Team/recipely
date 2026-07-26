import { RoutePaths } from '@presentation/base/constants';

/**
 * Resolves the post-login redirect target from the `redirect` search param.
 * Accepts the value only when it is an internal absolute path — starts with
 * `/`, is not protocol-relative (`//`), and is not the login route itself
 * (`/login` or `/login?...`, which would loop). Falls back to `/recipes` for
 * any unsafe or absent value.
 */
export const resolveRedirect = (redirect: string | string[] | undefined): string => {
  if (
    typeof redirect === 'string' &&
    redirect.startsWith('/') &&
    !redirect.startsWith('//') &&
    redirect !== RoutePaths.login &&
    !redirect.startsWith(`${RoutePaths.login}?`)
  ) {
    return redirect;
  }
  return RoutePaths.recipes;
};
