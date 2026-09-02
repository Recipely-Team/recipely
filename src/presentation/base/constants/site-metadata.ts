/**
 * What the web build calls itself, in the one place both readers can reach.
 *
 * @remarks
 * - **Two readers, so it is not a page's own constant.** `+html.tsx` writes it
 *   into the exported HTML shell (`<title>`, the description, Open Graph and
 *   Twitter cards) and the root layout hands it to the navigator as the default
 *   `title`. Spelled twice, the tab and the link preview could disagree about
 *   the name of the product.
 * - **Why the navigator needs it at all.** React Navigation resolves
 *   `document.title` as `options.title ?? route.name` on every navigation and
 *   assigns the result — so whatever the shell put there is overwritten the
 *   moment the app mounts. Without a default the site rendered a blank tab and
 *   handed a rendering crawler an empty `<title>`, which is a page with no name
 *   however much content is under it.
 * - **`route.name` is not a usable fallback.** It is the router's own segment
 *   (`recipes/index`), and shipping that as a title is worse than shipping the
 *   product's.
 */
export const SiteMetadata = {
  title: 'Recipely — AI Recipe Generator & Cooking Community',
  description:
    'Discover, create, and share recipes with an AI sous-chef. Generate a full recipe from a craving, browse by cuisine, track nutrition, and cook smarter with Recipely.',
  /** Suffix for a page that names itself first, e.g. a recipe. */
  titleSuffix: ' · Recipely',
} as const;
