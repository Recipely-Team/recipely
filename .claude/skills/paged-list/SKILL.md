---
name: paged-list
description: Building or changing any list that pages from the backend in the Recipely app — the repository/DTO side (page envelope, RequestMapper), the store side (PagedListLoader or ListPaging helpers), and the UI side (FlatList onEndReached, FeedFooter, refresh on focus, session reset). Use whenever a list screen, a list endpoint integration, infinite scroll, pull-to-refresh, a list count, or a "list doesn't load more / shows stale data / skips rows" bug is involved.
---

# Paged lists (service → store → UI)

Every list comes from the backend, one page at a time, and pages on scroll (rule 23d, memory
"Backend Paged Lists"). These rules come from real bugs: #592 (lists stuck at page 1, counts of
loaded rows), #595 (Chefs tab never re-read), #596 (rows skipped after a removal, failed pages that
stalled silently, a cancelled request that stranded `isLoadingMore`). Each rule says what breaks
without it.

## 1. Service: repository, DTO, mapper

- **The endpoint returns the envelope**: `items`, `total`, `page`, `pageSize`, `hasMore`. If the
  backend route doesn't, fix the backend first (backend PR, promoted before the app release).
- **Paging is a parameter, never a literal.** Query params come from a `RequestMapper` DTO; the
  repository issues the request, it does not build it (rule 23d).
- **`Page<T>` / `PageDto<T>` / `toPage` are the only page shapes.** No new type with
  `total` + `pageSize`/`hasMore` (`check:structure` rule AK).
- **A mapper test proves the requested page reaches the query**, and that `total`/`hasMore`
  survive the mapping. A list that drops them quietly becomes its first page.
- Searching and filtering happen **on the server**, never over a local snapshot of loaded rows.

## 2. Store

- **Use `PagedListLoader`** (`@application/store/paging/paged-list-loader`) with a `PagedList<T>`
  field. It already handles: newest first page wins (generation), no double load, a failure that
  keeps the rows and records `moreFailure`, `refresh` without a skeleton, removals shifting the
  next page's offset, `reset`.
- **Only if the rows must live outside a `PagedList`** (Saved / Liked / Created keep `ListPaging`
  beside their rows), use the shared helpers in `@application/store/paging/list-paging/`:
  `loadMorePaging` for the next page, `pagingAfterRemoval` for every removed row, `pagingOf` for
  a landed first page, `NO_PAGING` to start. **Never hand-roll `page + 1`.**
- **Every local removal goes through the loader/helper** (`removeItem`, `rewriteItems`,
  `pagingAfterRemoval`). A removal moves every later server row up; asking `page + 1` skips them.
- **A failed reload clears `isLoadingMore`** — a reload supersedes an in-flight next page, and a
  flag left on stops paging for good.
- **Counts read the server's `total`**, never `items.length`.
- **Viewer-dependent lists are cleared on sign-out**: add the store to `clearSessionCaches`
  (`application/di/register.ts`) and drop in-flight answers from the old session (`RequestEpoch`
  or the loader's generation). Public lists (Chefs, the feed) stay, but still refresh (§3).
- **Tests**: next page appended; next page after a removal; failure → `moreFailure` → retry;
  last page / in-flight is a no-op; an answer from a superseded load is dropped.

## 3. UI

- **One `FlatList` (or `SectionList`) is the scroller.** Never put a paged list inside a
  `ScrollView` with `scrollEnabled={false}`: `onEndReached` then fires never or on every
  render. If a wrapper must scroll (the web grid in the Recipes feed), page from its `onScroll`
  with the same threshold, as `use-recipe-list.ts` does.
- **Wire all four**: `onEndReached={loadMore}`,
  `onEndReachedThreshold={ListConstants.endReachedThreshold}`,
  `ListFooterComponent={<FeedFooter isLoadingMore failure={moreFailure} onRetry={loadMore} />}`,
  and `RefreshControl` calling the store's `refresh`. Without the footer's `failure`, a failed
  page looks like the end of the list and `onEndReached` never fires again (content length
  unchanged).
- **The screen's `loadMore` is a thin call into the store**; guards (`hasMore`, in-flight) live in
  the store, not in the component.
- **Re-read on every focus**: `useFocusEffect` — `load()` the first time, `refresh()` once loaded
  (no skeleton over loaded rows). Loading once on mount leaves a tab stale for the whole session.
- **Skeleton only for the first load**; a refresh keeps the rows. An error with no rows gets the
  error state with Retry; an error with rows keeps the rows.
- **Stable `keyExtractor`** from the entity id, never the index (rule 9); no
  `removeClippedSubviews` (rule 6c); bound mounted rows with `ListConstants` (`windowSize`, …).
- **Empty state ≠ loading ≠ error**: an `Idle` / `Loading` list never shows the empty copy.
- **Screen tests**: reaching the end calls the store's `loadMore`; a focus triggers `refresh`
  on a loaded list (mock `useFocusEffect` to run once, as `creators-screen.test.tsx` does); the
  footer renders "Try again" for a `moreFailure`.

## 4. Check it live before reporting

- Web: open the list on recipely.net / the dev web app, scroll to the end, and confirm every row
  arrives (compare with the server's `total`, e.g. a read-only count on the DB via the `dev-db`
  skill). Network logs reset on navigation; count rendered rows instead.
- Native: scroll to the end on the emulator/device; for signed-in lists, the user verifies.
