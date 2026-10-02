import * as Linking from 'expo-linking';
import { RoutePaths } from '@presentation/base/constants';

/**
 * Where Instagram sends the user back: `recipely://instagram-connected` (or
 * `recipely-dev://…`, the build's own scheme) on a phone, this site's
 * `/instagram-connected` on the web — the forms backend #374 accepts.
 */
export const instagramReturnUrl = (): string => Linking.createURL(RoutePaths.instagramConnected);
