---
name: new-screen
description: Checklist for adding a new routed page to the Recipely app — app/<segment>/index.tsx with co-located folders, RoutePaths, analytics screen name (rule 25), sitemap or robots classification (rule 23f), i18n in all locales, assistant scroll wiring, and the regenerated PROJECT-MAP. Use whenever a new expo-router route/screen/page is created, renamed or removed.
---

# New screen

A new visual surface goes through the `design-handoff` skill first (rule 28).

## 1. The route

- Create `src/presentation/app/<segment>/index.tsx`: the route component as a named export
  (`<Name>Screen`) plus `export default`. A flat `app/<segment>.tsx` does NOT register — only
  `index.tsx`, `_layout.tsx`, `+special` and `[param]` files are routes (custom route context in
  `src/presentation/navigation/route-context.js`, wired in `metro.config.js`).
- Co-locate parts in `body/`, `items/`, `sheets/`, `hooks/`, `model/`, `__tests__/` only
  (`check:structure` rule E). Multi-page features add `shared/`. A widget a second page uses moves
  to `src/presentation/base/widgets/<category>/`.
- `index.tsx` is composition only: target ≤ ~200 lines, zero business rules; no `.tsx` over 300
  lines (rule 18, `check:structure` rule F). Screen vocabulary (which sheet is open, which field is
  focused) is a const object in the page's `model/` (rule 5).
- Add the navigation target to `RoutePaths` in `src/presentation/base/constants/route-paths.ts`;
  never hard-code a route string at a call site.

## 2. Analytics name (rule 25, `check:structure` rule AA)

- Add the name to `AnalyticsScreen` in `src/infrastructure/constants/analytics/analytics-screen.ts`,
  spelled exactly as the route's exported component (`RecipeListScreen`).
- Add the row `[RoutePaths.<x>, AnalyticsScreen.<x>]` to `SCREEN_BY_PATH` in
  `src/presentation/bootstrap/use-screen-tracking.ts`.
- A route that renders only a `Redirect` is excluded. A screen name is a join key — rename only on
  purpose.

## 3. Crawlable surface (rule 23f)

Classify the route in exactly one place:

- **Content** → a `<loc>` in `public/sitemap.xml`. A `[param]` route is content only when its parent
  is listed AND `firebase.json` rewrites it (both `hosting` targets carry the rewrites).
- **Not content** (a form, wizard, account page) → `Disallow: /<segment>` in `public/robots.txt`.

Neither, or both, fails `scripts/assert-crawlable-surface.mjs` (part of `npm run check:structure`).
Ads never go on a new screen unless it is publisher content and the rule T allowlist is changed
on purpose (rule 23e).

## 4. Copy, a11y, layout

- Every visible string via `t()`; add keys to all 14 locales with the `i18n-copy` skill.
- Every `Pressable` has `accessibilityRole` and, when the label is not plain text, an
  `accessibilityLabel` (rule 10).
- Width decisions use `isExpanded`; browser-chrome decisions use `isWebShell` (rule 6b2).
- Sheets and dialogs come from `base/widgets/sheets/` (rule 23).

## 5. Assistant

A page with a scroller must register scroll for the voice assistant (`useAssistantScroll`, a child
taking `AssistantScrollableProps`, or `ScreenContainer`) unless the route is in
`CLOSED_TO_ASSISTANT` (`src/presentation/base/hooks/assistant/use-assistant-is-offered.ts`) —
`check:structure` rule X. A screen that registers a screen line must also register a reading
(`useAssistantScreenReading`, rule AB); assistant registration is focus-scoped (rule AE).

## 6. Finish

```bash
npm run map              # PROJECT-MAP.md (rule 15b, check:structure rule J)
npm run check:structure
```

Then the `pr-flow` skill. For a web-facing route, `npm run build:web` also runs
`assert-page-titles.mjs` (every exported page has exactly one non-empty `<title>`). The root layout
renders the site title; a page with a real name renders `<PageTitle subject={…} />` from
`@presentation/base/widgets/head/page-title` — never a navigator `title` option, which does nothing.
