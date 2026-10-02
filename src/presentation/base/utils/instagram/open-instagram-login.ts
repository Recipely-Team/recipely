import * as WebBrowser from 'expo-web-browser';
import type { OpenInstagramLoginType } from '@presentation/base/utils/instagram/open-instagram-login-type';

const SUCCESS = 'success';

/**
 * Native: an auth session (ASWebAuthenticationSession / Custom Tab) that
 * closes itself on the return link and hands it back; cancel or dismiss is null.
 */
export const openInstagramLogin: OpenInstagramLoginType = async (loginUrl, returnUrl) => {
  const result = await WebBrowser.openAuthSessionAsync(loginUrl, returnUrl);
  return result.type === SUCCESS ? result.url : null;
};
