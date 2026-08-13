# Backend Contract & Frontend Parity — Tracking

> All items resolved and shipped to `dev`. Kept as a record of what was
> investigated and why.

Source: recipely-backend commits `3c9106b` (lean list DTO, #162) and `dd78b76`
(public recipe detail, #164), plus local bug screenshots in `~/Desktop/Hatalar/`.

Verified against the backend repo before starting — see notes per item.

## Phase 1 — Data Model Realignment & Contract Breakdown

- [x] **Lean list DTO parity.** Backend's `RecipeListItemDto`/`PagedRecipeListDto`
      (verified: recipely-backend `3c9106b`) exposes only `id, name, image,
      cuisine, category, difficulty, totalTimeMinutes, rating,
      moderationStatus, likeCount, likedByMe, commentCount, viewCount` for
      list/my-recipes/trending. Detail (`GET /recipes/:id`) is unchanged
      (full `RecipeDto`).
      Approach (confirmed with user): new lightweight `RecipeSummary` domain
      entity for list contexts; `Recipe` stays the full detail entity,
      untouched.
  - [x] `src/infrastructure/recipes/recipe-list-item-dto.ts` — new DTO
  - [x] `src/infrastructure/recipes/recipes-list-dto.ts` — `items` → `RecipeListItemDto[]`
  - [x] `src/domain/recipes/recipe-summary.ts` — new entity
  - [x] `src/infrastructure/recipes/recipe-mapper.ts` — add `toRecipeSummary`
  - [x] `src/domain/recipes/i-recipe-repository.ts` — list methods return `RecipeSummary[]`
  - [x] `src/infrastructure/recipes/recipe-repository.ts` — wire lean mapping for list methods
  - [x] `src/application/__fixtures__/fake-recipe-repository.ts` — update fixture types
  - [x] `src/application/recipes/list-recipes-use-case.ts`, `list-my-recipes-use-case.ts`,
        `list-trending-recipes-use-case.ts` — return `RecipeSummary[]`
  - [x] `src/domain/recipes/recipe.ts` — added `moderationStatus`/`commentCount`
        getters (already on `RecipeDto`, previously dropped by `toRecipe`)
  - [x] `src/domain/recipes/recipe-to-summary.ts` — new `Recipe` → `RecipeSummary`
        converter (used to keep `created-recipes-store`'s lean list in sync
        after create/update)
  - [x] `src/application/recipes/created-recipes-store.ts` — split `recipes`
        (lean, My Recipes grid) from `localRecipes` (full-detail cache
        backing `findById`); public method signatures unchanged
  - [x] `src/core/failure/validation-failure.ts` — `fieldErrors` getter (see
        validation item below)
  - [x] Quality gate on domain/application/infrastructure: lint clean,
        `tsc --noEmit` clean for these layers, full jest suite green
        (80 suites / 928 tests). Committed on `feat/lean-recipe-list-dto`
        (`9310d86`).
  - [x] **Presentation layer** (rn-developer, commit `264f111`):
    - [x] `web-recipe-card.tsx`, `web-hero-mini-card.tsx` — `RecipeSummary`,
          `totalTimeMinutes` directly
    - [x] `my-recipes-screen.tsx`, `recipe-list-screen.tsx`,
          `trending-strip.tsx`, `web-recipe-grid.tsx`, `recipe-list-item.tsx`
          — retyped to `RecipeSummary`
    - [x] **Product decision (confirmed with user):** lean payload has no
          `tags`/`ownerId`, so mobile cards drop the tags-chip row
          (`recipe-card.tsx`'s `tags` now optional) and
          `web-hero-featured-card.tsx` drops its author row (consistent with
          the existing "no author row, avoids N+1" rule already in
          `web-recipe-card.tsx`). Both remain visible on the full recipe
          detail screen, unaffected.
  - [x] Full quality gate, project-wide: lint clean, `tsc --noEmit` clean
        (0 errors), jest 82 suites / 932 tests passing. Two commits on
        `feat/lean-recipe-list-dto`: `9310d86` (domain/application/
        infrastructure) + `264f111` (presentation). Merged to `dev` as
        PR #127 (`cb096e3`).
- [x] **Multi-field validation parsing.** Backend now reports every failing
      Zod field, joined into one string in `error.message`
      (`"name: too short; category: invalid"`), `error.field` = first
      offender only (verified in recipely-backend `error-handler.ts` /
      `failure-to-http.ts` — not a JSON array as originally assumed).
      Scope for Phase 1 (confirmed with user): parse into structured data
      now; inline UI binding is Phase 4's "Form Fields Validation Mapping"
      item.
  - [x] `src/core/failure/validation-failure.ts` — added `fieldErrors` getter,
        splits `message` on `'; '` then each segment's first `': '`. Purely
        additive — existing `message`/`field` readers unaffected.
  - [x] Confirmed `src/application/recipes/created-recipes-store.ts` already
        surfaces the raw `ValidationFailure` via `createState`/`updateState`
        — no store change needed for this part. UI binding shipped with
        Phase 4's "Form field validation" item (PR #135).
- [x] **Base API URL / DummyJSON cleanup** — already resolved in this repo.
      `src/infrastructure/constants/api.ts` already separates prod
      (`api.recipely.net`) / dev (`dev-api.recipely.net`) via build variant;
      DummyJSON only remains in one test fixture's image URLs. No code change.

## Phase 2 — Guest View Authorization Flows & Deep Linking

- [x] Public shared recipe preview for guests (backend verified:
      recipely-backend `dd78b76` — `GET /recipes/:id` now public,
      unpublished filtered by owner; re-verified directly against
      `recipes.routes.ts` that list/trending/mutations still require auth).
      `src/presentation/navigation/use-auth-guard.ts` now exempts only the
      single-recipe detail path (`RECIPE_DETAIL_PATH` regex), not the list.
- [x] Conditional auth-interception CTAs for guest mutation attempts (like,
      bookmark, comment, comment-like). New `useGuestGate` hook +
      `SignInPromptSheet` widget, wired into native (`recipe-detail-screen.tsx`)
      and web (`web-recipe-detail*.tsx`). **"See More" skipped as N/A** — no
      such gated-expansion UI exists anywhere in the codebase to retrofit.
  - Branch `feat/guest-recipe-access`, 3 commits, code-reviewer approved
    (no blocking findings; 2 minor test gaps it flagged were closed).
    Quality gate: lint clean, `tsc --noEmit` clean, jest 88 suites / 971
    tests passing. Merged to `dev` as PR #128 (`ca90dda`).

## Phase 3 — State Lifecycle & Navigational Performance

- [x] **Cuisine/category filter change → partial state update.** Confirmed real:
      no literal remount, but `recipe-list-store.ts`'s `load()` reset to a bare
      `loading` state on every filter change, wiping the header/cuisine-strip/
      filter-chips (mobile) and blanking to a full skeleton grid (web) during
      a refetch. Fixed: `recipe-list-state.ts`'s `loaded` variant gained
      `isRefreshing`/`refreshFailure`; the stale list now stays visible during
      a refetch, with a native pull-to-refresh spinner (mobile) / small inline
      indicator (web) and a one-shot toast on refresh failure. Branch
      `feat/recipe-list-partial-refresh` (PR #129), code-reviewer approved
      (zero findings), merged to `dev`. 91 suites / 991 tests passing.
- [x] **Profile bio edit → cache/store invalidation.** Initially investigated
      and marked N/A (no display surface existed for bio anywhere, so nothing
      could go stale). **Reopened in Phase 4** once direct tester evidence
      surfaced ("Profil düzenle kısmında bioma yazdığım şeyi profilde
      görmüyorum" — expected to see it and didn't): added a bio display to
      `profile-screen.tsx`, sourced from `authStore`'s already-fresh
      `session.user.bio`. See Phase 4 for the shipped fix (PR #134).

## Phase 4 — Core Presentation Layout & Responsive UX (screenshots + WhatsApp
tester feedback in `~/Desktop/Hatalar/`) — all shipped, merged to `dev`

- [x] Status bar overlapping "Recipely"/"Recipes" header on native — root
      cause: the absolutely-positioned collapsing header band fell outside
      its parent SafeAreaView's flow. PR #130.
- [x] Filter/Share bottom sheet: grabber is now a real swipe+tap-to-dismiss
      control (RN `PanResponder`, no gesture-handler root needed); redundant
      header "×" hidden by default now that the grabber is a real dismiss
      affordance. PR #136.
- [x] Search results overlay — mobile now swaps the whole body for a
      dedicated `RecipeSearchOverlay` under the sticky search bar instead of
      scrolling past the AI banner/cuisine strip. PR #131.
- [x] Timer badge wrapping inside instruction text — a "45-50 minutes" range
      was badge-ifying only the trailing number, splitting the sentence;
      whole ranges are now kept as plain text. PR #132.
- [x] Form field validation — `ValidationFailure.fieldErrors` (Phase 1) is
      now bound to Cuisine/Category/Servings/Difficulty/Prep/Cook/
      Ingredients/Instructions with a red border + inline message, backend
      field names confirmed against the real Zod validators. PR #135.
- [x] AI assistant viewport — fixed double-padding against the parent
      `KeyboardAvoider` during keyboard show/hide; collapse control is now a
      clearer "X" that also dismisses the keyboard. PR #135.
- [x] TR localization — theme-palette swatch labels reserve a fixed
      two-line height instead of a single-line height TR names could
      overflow. PR #133.
- [x] Micro UI cleanup: filter-count badge digit centered (lineHeight/
      includeFontPadding fix); "Clear" renamed to "Clear Filters" (en/tr);
      "Recipe by" author card moved near the title instead of after
      nutrition; duplicate floating timer widget deduped against the recipe
      detail screen's own inline countdown; Fiber row reformatted to a
      single "Fiber: 11g" string; theme palette trimmed from 19 to 4 colors.
      PRs #131, #132, #133.
- [x] **Bonus (not in the original list, found via tester feedback):**
      profile bio display added (PR #134, reopens the Phase 3 N/A above);
      pull-to-refresh spinner confirmed already fixed as a side effect of
      Phase 3 (no separate PR needed).

Deliberately skipped as N/A: "See More" auth-interception (Phase 2 scope) —
no such gated-expansion UI exists anywhere in the codebase to retrofit.
