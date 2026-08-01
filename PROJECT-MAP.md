# Project map

**GENERATED — do not edit.** Run `npm run map` after moving or adding files;
`npm run check:structure` fails while this file is stale.

Read this before exploring: it answers "where does X live?" without a grep.
Rules live in [CLAUDE.md](CLAUDE.md); the reasoning behind them in
[architecture.md](architecture.md). 756 source files.

## Layers

`core` → nothing · `domain` → core · `application` → domain, core ·
`infrastructure` → domain, core · `presentation` → application, domain, core.
Never upward. Exceptions: `infrastructure/constants/*` is importable anywhere;
`*/di/` and `presentation/bootstrap/` are the composition root.

## Routes — `src/presentation/app/<segment>/index.tsx`

`ai-generate` · `create-recipe` · `edit-profile` · `forgot-password` · `login` · `my-recipes` · `notifications` · `onboarding` · `profile` · `recipes` · `register` · `reset-password` · `settings` · `verify-code`

Nested detail pages: `recipes/[…]`.
Each page folder holds `body/ items/ sheets/ hooks/ model/` (+ `shared/` when
it has a nested page). Only `index.tsx`, `_layout.tsx`, `+special` and
`[param]` register as routes.

## `src/domain/` — entities, value objects, port interfaces

- `audio/` _(1)_
- `auth/` _(7)_
- `comments/` _(4)_
- `common/` _(1)_
- `drafts/` _(7)_
- `favorites/` _(1)_
- `feedback/` _(3)_
- `i18n/` _(1)_
- `likes/` _(1)_
- `network/` _(2)_
- `notifications/` _(10)_
- `recipes/` — create, ingredients, list, media, refine, taxonomy _(24)_
- `storage/` _(1)_
- `user-profile/` _(3)_

## `src/application/` — use cases, stores, DI

- `audio/` _(2)_
- `auth/` — password-reset, profile, registration, session, sign-in _(16)_
- `comments/` — add, delete, like, list _(15)_
- `di/` _(3)_
- `drafts/` — list, read, write _(10)_
- `favorites/` _(5)_
- `feedback/` _(3)_
- `i18n/` _(4)_
- `likes/` _(5)_
- `notifications/` — list, read _(10)_
- `onboarding/` _(2)_
- `recipes/` — create, delete, detail, generate, import, list, my-recipes, refine, saved, taxonomy, trending _(34)_
- `storage/` _(2)_
- `store/` _(2)_
- `timers/` _(7)_
- `user-profile/` _(5)_

## `src/infrastructure/` — repository impls, DTOs, mappers, IO

- `audio/` _(2)_
- `auth/` — dtos, registration, session, social _(21)_
- `comments/` — dtos _(4)_
- `constants/` — api _(14)_
- `crypto/` _(3)_
- `di/` _(1)_
- `drafts/` — dtos _(6)_
- `favorites/` _(2)_
- `feedback/` _(3)_
- `firebase/` _(4)_
- `i18n/` _(1)_
- `likes/` _(1)_
- `network/` — envelope, errors, http, jwt, paging, upload _(25)_
- `notifications/` — dtos _(8)_
- `recipes/` — create, dtos, media, refine, taxonomy _(21)_
- `storage/` _(6)_
- `user-profile/` _(3)_

## `src/core/` — building blocks only

- `constants/` _(6)_
- `di/` _(1)_
- `entity/` _(1)_
- `failure/` — kinds _(16)_
- `guards/` _(1)_
- `mapper/` _(2)_
- `result/` _(2)_
- `value-object/` _(1)_

No app catalogues here: the DI token list is `application/di/tokens.ts`, the
locale list `application/i18n/locale-constants.ts`.

## `src/presentation/base/` — shared UI

- `constants/` — cross-cutting UI values that are not measurements (animation drivers, route paths) _(5)_
- `errors/` — Failure → user-facing copy/severity lookups _(6)_
- `feedback/` — toast store, host and helpers _(9)_
- `forms/` — shared field limits _(1)_
- `hooks/` (auth, interaction, profile, recipes, sync, timers) — shared hooks, grouped by capability _(16)_
- `responsive/` — breakpoints, LayoutProvider, viewport metrics _(8)_
- `taxonomy/` — cuisine/category/difficulty display vocabulary _(6)_
- `test-support/` — render harness for component tests _(3)_
- `theme/` (colors, context, tokens) — design tokens, palettes, active-theme context _(44)_
- `timers/` — timer control helpers _(7)_
- `utils/` — small pure helpers _(6)_
- `web-shell/` — web-only shared UI state (header search query) _(3)_
- `widgets/` (brand, buttons, cards, dialogs, feedback, inputs, layout, lists, loading, media, navigation, settings, sheets, text, timers, web-header) — shared components, grouped by category _(43)_

### Design tokens — `base/theme/tokens/`

  - `effects/` — color-alphas, opacities, shadows, z-indices
  - `sizing/` — aspect-ratios, avatar-sizes, border-widths, control-sizes, decor-sizes, icon-sizes, layout-sizes, media-sizes, radii, spacing
  - `typography/` — font-sizes, font-weights, letter-spacings, line-height-for, line-heights, max-font-scales, use-text-line-height

Consumed through the `@presentation/base/theme` barrel. `colors/` holds
`palette/ surfaces/ contrast/`; `context/` holds the active-theme provider.

## Where to put a new thing

| Adding… | Goes in |
|---|---|
| A screen | `presentation/app/<segment>/index.tsx` |
| A part of one screen | that page's `body/ items/ sheets/ hooks/ model/` |
| A widget two+ pages use | `presentation/base/widgets/<category>/` |
| A design measurement | `presentation/base/theme/tokens/<purpose>/` |
| A use case | `application/<feature>/<capability>/` |
| An entity or port interface | `domain/<feature>/` |
| A repository implementation | `infrastructure/<feature>/` |
| An API endpoint or storage key | `infrastructure/constants/` |
| A structural literal (`''`, `0`, a shared regex) | `core/constants/` |

## Commands

`npm start` · `npm run web|ios|android` · `npm run lint` ·
`npm run typecheck` · `npm test` · `npm run check:structure` ·
`npm run map` · `npm run build:web`

All four gates must be green before anything is done.

<!-- fingerprint: fbb89b8500d3509c -->
