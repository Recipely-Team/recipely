/**
 * How much of a list the app asks for at a time, and where counting starts.
 *
 * @remarks
 * These are requests, not guarantees — the backend caps some of them, and a
 * repository must read the page it is handed back rather than assume it got
 * what it asked for. `FIRST_PAGE` exists because the API counts from 1 and a
 * bare `1` in a repository is how every list ended up pinned to page one.
 */

/** The API is 1-based; this is the page every unqualified request means. */
export const FIRST_PAGE = 1;

export const RECIPES_PAGE_SIZE = 30;

export const MY_RECIPES_PAGE_SIZE = 20;

export const DRAFTS_PAGE_SIZE = 20;

/** The saved grid has no paging UI, so this is the ceiling on what a user can see. */
export const FAVORITES_PAGE_SIZE = 100;

export const COMMENTS_PAGE_SIZE = 20;

/** Backend caps `limit` at 1–30. */
export const TRENDING_RECIPES_LIMIT = 10;
