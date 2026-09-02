/**
 * What the web build calls itself, in the one place both readers can reach.
 *
 * @remarks
 * - **Two readers, so it is not a page's own constant.** `+html.tsx` writes the
 *   description and the Open Graph / Twitter cards into the exported HTML
 *   shell, and `PageTitle` writes the title through helmet. Spelled twice, the
 *   tab and the link preview could disagree about the name of the product.
 * - **The title is NOT in the shell.** Expo Router mounts react-helmet-async at
 *   the root and it emits its own `<title>` ahead of anything the shell writes,
 *   so a title there is a second one and never the one a browser reads. See
 *   `PageTitle`.
 * - **`titleSuffix` is not decoration.** A recipe page titled only "Kısır" says
 *   nothing about where it is; every search result and shared tab reads better
 *   with the site on the end, and it is what stops two sites' pages looking
 *   identical in a list of results.
 */
export const SiteMetadata = {
  title: 'Recipely — AI Recipe Generator & Cooking Community',
  description:
    'Discover, create, and share recipes with an AI sous-chef. Generate a full recipe from a craving, browse by cuisine, track nutrition, and cook smarter with Recipely.',
  /** Suffix for a page that names itself first, e.g. a recipe. */
  titleSuffix: ' · Recipely',
} as const;
