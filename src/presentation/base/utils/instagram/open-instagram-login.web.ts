import type { OpenInstagramLoginType } from '@presentation/base/utils/instagram/open-instagram-login-type';

/**
 * Web: the login runs in this tab, and the return route
 * (`/instagram-connected`) finishes it when Instagram sends the user back —
 * a popup would be blocked and would leave the tab behind it guessing. The
 * promise never settles: the page is about to unload.
 */
export const openInstagramLogin: OpenInstagramLoginType = (loginUrl) => {
  window.location.assign(loginUrl);
  return new Promise<string | null>(() => undefined);
};
