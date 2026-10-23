/**
 * URL pieces used by more than one layer.
 *
 * @remarks
 * - Hosts and endpoints are NOT here: they belong to
 *   `infrastructure/constants/api/`, outside links to
 *   `presentation/base/constants/external-links.ts`. This holds only the
 *   structural parts every layer spells the same way.
 */
export const UrlConstants = {
  httpsScheme: 'https://' as string,
} as const;
