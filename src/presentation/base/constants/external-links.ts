/**
 * Addresses outside the app.
 *
 * @remarks
 * - **A builder, not a literal at the call site**, the same way `RoutePaths`
 *   treats in-app targets. `'https://instagram.com/' + handle` spelled where it
 *   is used is the magic value rule 5 forbids, and it is the spelling that
 *   quietly forks when a second screen needs the same link.
 */
export const instagramProfileUrl = (handle: string): string => `https://instagram.com/${handle}`;
