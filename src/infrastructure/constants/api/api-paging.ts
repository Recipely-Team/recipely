/**
 * How much of a list the repositories ask for when no caller chooses.
 *
 * @remarks
 * These are requests, not guarantees — the backend caps some of them, and a
 * repository must read the page it is handed back rather than assume it got
 * what it asked for. The page sizes a store chooses live in
 * `application/config/page-sizes.ts`; the first page is `FIRST_PAGE` in
 * `domain/common/first-page.ts`.
 */

export const RECIPES_PAGE_SIZE = 30;

export const MY_RECIPES_PAGE_SIZE = 20;

/** The saved grid has no paging UI, so this is the ceiling on what a user can see. */
export const FAVORITES_PAGE_SIZE = 100;

/** Same deal as the saved grid: the liked tab shows one page and no more. */
export const LIKED_RECIPES_PAGE_SIZE = 100;

/** Backend caps `limit` at 1–30. */
export const TRENDING_RECIPES_LIMIT = 10;
