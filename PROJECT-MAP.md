# Project map

**GENERATED — do not edit.** Run `npm run map` after moving or adding files;
`npm run check:structure` fails while this file is stale.

Read this before exploring: it answers "where does X live?" without a grep.
Rules live in [CLAUDE.md](CLAUDE.md); the reasoning behind them in
[architecture.md](architecture.md). 1921 source files.

## Layers

`core` → nothing · `domain` → core · `application` → domain, core ·
`infrastructure` → domain, core · `presentation` → application, domain, core.
Never upward. Exceptions: `infrastructure/constants/*` is importable anywhere;
`*/di/` and `presentation/bootstrap/` are the composition root.

## Routes — `src/presentation/app/<segment>/index.tsx`

`ai-generate` · `automations` · `create-recipe` · `creators` · `diary` · `edit-profile` · `forgot-password` · `import-recipe` · `instagram-connected` · `login` · `my-recipes` · `notifications` · `onboarding` · `profile` · `recipes` · `register` · `reset-password` · `settings` · `shopping-list` · `verify-code`

Nested detail pages: `creators/[…]`, `recipes/[…]`.
Each page folder holds `body/ items/ sheets/ hooks/ model/` (+ `shared/` when
it has a nested page). Only `index.tsx`, `_layout.tsx`, `+special` and
`[param]` register as routes.

## `src/domain/` — entities, value objects, port interfaces

- `ads/` _(1)_
- `analytics/` _(1)_
- `assistant/` — actions, os, session _(25)_
- `audio/` _(1)_
- `auth/` _(8)_
- `comments/` _(5)_
- `common/` _(5)_
- `creators/` _(13)_
- `device/` _(3)_
- `diary/` — calendar, day, entry, foods, meal, month, nutrition _(60)_
- `display/` _(5)_
- `drafts/` _(6)_
- `favorites/` _(1)_
- `feedback/` _(4)_
- `flags/` _(1)_
- `i18n/` _(1)_
- `instagram/` — activity, connect, dm _(24)_
- `likes/` _(1)_
- `notifications/` _(13)_
- `recipes/` — create, edit, import, import-file, ingredients, list, media, nutrition, provenance, publishing, refine, taxonomy _(76)_
- `shopping/` — items, recipe _(13)_
- `storage/` _(3)_
- `user-profile/` _(5)_

## `src/application/` — use cases, stores, DI

- `ads/` _(2)_
- `assistant/` — actions, session _(16)_
- `audio/` _(2)_
- `auth/` — password-reset, profile, registration, session, sign-in _(17)_
- `comments/` — add, delete, like, list _(12)_
- `config/` _(6)_
- `creators/` — claim, list, profile _(10)_
- `device/` _(2)_
- `di/` — features _(15)_
- `diary/` — day, entries, foods, goals, meal, month _(27)_
- `drafts/` — list, read, write _(8)_
- `favorites/` _(5)_
- `feedback/` _(3)_
- `i18n/` _(5)_
- `instagram/` — activity, connect, rules _(17)_
- `likes/` _(5)_
- `notifications/` — list, read _(10)_
- `onboarding/` _(2)_
- `recipes/` — cooking, create, delete, detail, edit, generate, import, import-file, liked, list, my-recipes, photos, publishing, refine, saved, taxonomy, trending _(60)_
- `shopping/` — read, write _(11)_
- `storage/` _(4)_
- `store/` — paging _(10)_
- `timers/` _(7)_
- `user-profile/` — follow, recipes _(8)_

## `src/infrastructure/` — repository impls, DTOs, mappers, IO

- `ads/` _(2)_
- `assistant/` — message, os, token _(10)_
- `audio/` _(2)_
- `auth/` — dtos, registration, session, social _(26)_
- `comments/` — dtos _(3)_
- `constants/` — analytics, api _(20)_
- `creators/` — dtos _(14)_
- `crypto/` _(3)_
- `device/` _(8)_
- `di/` _(1)_
- `diagnostics/` _(1)_
- `diary/` — dtos, foods, meal, read, write _(62)_
- `display/` _(4)_
- `drafts/` — dtos _(5)_
- `favorites/` _(1)_
- `feedback/` _(3)_
- `firebase/` _(7)_
- `flags/` _(2)_
- `i18n/` _(1)_
- `instagram/` — dtos, read, write _(21)_
- `likes/` _(1)_
- `network/` — envelope, errors, http, jwt, paging, upload _(26)_
- `notifications/` — dtos _(10)_
- `recipes/` — create, dtos, edit, import, import-file, media, publishing, refine, taxonomy _(33)_
- `shopping/` — dtos _(10)_
- `storage/` _(7)_
- `user-profile/` _(4)_

## `src/core/` — building blocks only

- `codec/` _(1)_
- `constants/` _(6)_
- `di/` _(1)_
- `entity/` _(1)_
- `failure/` — kinds _(17)_
- `guards/` _(1)_
- `mapper/` _(2)_
- `result/` _(2)_
- `value-object/` _(1)_

No app catalogues here: the DI token list is `application/di/tokens.ts`, the
locale list `application/i18n/locale-constants.ts`.

## `src/presentation/base/` — shared UI

- `constants/` — cross-cutting UI values that are not measurements (animation drivers, route paths) _(10)_
- `errors/` — Failure → user-facing copy/severity lookups _(9)_
- `feedback/` — toast store, host and helpers _(10)_
- `forms/` — shared field limits _(1)_
- `hooks/` (accessibility, ads, assistant, auth, diary, instagram, interaction, navigation, notifications, profile, recipes, sync, timers) — shared hooks, grouped by capability _(100)_
- `responsive/` (fold) — breakpoints, LayoutProvider, viewport metrics _(13)_
- `taxonomy/` — cuisine/category/difficulty display vocabulary _(6)_
- `test-support/` — render harness for component tests _(5)_
- `theme/` (colors, context, tokens) — design tokens, palettes, active-theme context _(51)_
- `timers/` — timer control helpers _(9)_
- `utils/` (diary, instagram) — small pure helpers _(28)_
- `web-shell/` — web-only shared UI state (header search query) _(3)_
- `widgets/` (ads, assistant, badges, brand, buttons, cards, creators, dialogs, diary, feedback, head, inputs, instagram, layout, lists, loading, media, navigation, settings, sheets, text, timers, tooltip, web-header) — shared components, grouped by category _(197)_

### Design tokens — `base/theme/tokens/`

  - `effects/` — color-alphas, durations, opacities, shadows, z-indices
  - `sizing/` — aspect-ratios, avatar-sizes, border-widths, brand-mark-sizes, control-sizes, decor-sizes, diary-sizes, icon-sizes, layout-sizes, media-sizes, radii, spacing, target-sizes
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

<!-- fingerprint: c78c7f13377d6af0 -->
