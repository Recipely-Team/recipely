/**
 * **Page sizes** — how much of each list the app asks for at a time.
 *
 * @remarks
 * - **Product decisions, not API facts:** "5 rule cards a page" is a design choice, so it
 *   lives with the application that pages, not in the infrastructure that sends the query.
 * - **Requests, not guarantees:** the backend caps some of them; a store reads the page it
 *   is handed back rather than assume it got what it asked for.
 * - **Repository-only sizes** (recipe feed, my recipes, favourites, liked, trending) stay in
 *   `infrastructure/constants/api/api-paging.ts`.
 */
export const PageSizes = {
  comments: 20,
  /** The Explore creators strip; the backend defaults to 20 and caps at 50. */
  creators: 20,
  /** A creator's recipes on their profile page; the backend caps pageSize at 100. */
  creatorRecipes: 20,
  drafts: 20,
  /** The notifications badge only needs `unreadCount`, which comes with any page: one item is the cheapest ask. */
  unreadProbe: 1,
  /** Each group of the Add food search, per page (Add food v2 spec §3); the backend caps pageSize at 100. */
  foodSearch: 8,
  /** The Add food sheet's catalogue lists — categories, products, recent foods. */
  foodList: 20,
  /** Automations list (design spec: 5 rule cards a page). */
  dmRules: 5,
  /** A rule's activity, per page (design spec: 8 rows). */
  dmSends: 8,
  /** The post picker, per page (design spec: a 3 × 3 grid on a phone; the backend caps it at 50). */
  instagramMedia: 9,
  /** The rule editor's recipe picker (design spec: 6 rows). */
  dmRecipes: 6,
} as const;
