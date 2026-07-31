# Architecture

Recipely follows **Domain-Driven Design (DDD)** with a **Layered Architecture** inspired by Eric Evans'
_Domain-Driven Design: Tackling Complexity in the Heart of Software_ (2003).

---

## Layer Overview

All five layers live under `src/`; static binary assets live in `assets/` at the repo root
(exposed to code via the `@assets/*` alias, registered in `src/infrastructure/constants/assets.ts`).

```
src/
  presentation/
    app/              Pages (expo-router root): app/<segment>/index.tsx + co-located body/items/sheets/hooks/model
    navigation/       Shell: route-context.js, auth guard, share-import hook, alarm overlay
    i18n/             Internationalization
    base/             Widgets (categorized), theme, utils
    bootstrap/        DI init, stores context
    |
  application/        Use cases, state stores, DI registration
    |
  domain/             Entities, value objects, repository interfaces
    |
  infrastructure/     Repository implementations, DTOs, mappers, network, storage
    |
  core/               Framework-agnostic building blocks (Result, Failure, BaseEntity, DI)
```

### Dependency Rule

Each layer may only depend on layers **below** it. Never import upward:

- `src/domain/` — never imports from `src/application/`, `src/infrastructure/`, or `src/presentation/`.
- `src/application/` — never imports from `src/infrastructure/` or `src/presentation/`.
- `src/infrastructure/` — never imports from `src/presentation/` or `src/application/`.
- `src/presentation/` — may import `src/application/`, `src/domain/` (types/entities as read models), and `src/core/`;
  never `src/infrastructure/`.
- `src/core/` — imports nothing else from the project.

**Sanctioned exceptions** (the only ones):

- `src/infrastructure/constants/*` may be imported from anywhere — Coding Standard 5 deliberately homes
  API URLs / limits / storage keys there.
- `src/presentation/bootstrap/` and the `*/di/` wiring modules are the **composition root**: they may
  import across layers to assemble the object graph. Nothing else may.
- Anything beyond that lives in the `KNOWN_DEBT` list inside `scripts/check-structure.mjs`. That list
  only shrinks — adding an entry requires explicit user approval in review.

The dependency rule and the exceptions above are enforced mechanically by `npm run check:structure`
(see Pre-Commit Quality Gate).

`src/presentation/app/` is the expo-router root (`"root": "src/presentation/app"` in `app.json`) **and** where
page implementations live. Only `index.tsx`, `_layout.tsx`, `+special` and `[param]` files register as
routes; everything else in a page folder is co-located page code, hidden from the router by the custom
route context (`src/presentation/navigation/route-context.js`, wired via `metro.config.js`) and stripped from
static web exports by `scripts/prune-web-export.mjs`.

---

## DDD Guardrails (Evans 2003)

Audited against Eric Evans, _Domain-Driven Design_ (2003 final manuscript). These rules exist so the
findings of that audit can never regress. Page numbers refer to the manuscript. Each rule maps to a
Mandatory Coding Standard in `CLAUDE.md` (17–20) and is BLOCKING in review.

### Ports, not direct infrastructure (Evans p.55 — CLAUDE.md §17)

Infrastructure serves upper layers as **SERVICES behind interfaces**. The repository-interface pattern
(`src/domain/**/i-*-repository.ts` + implementation in `src/infrastructure/`) is the template: any other
infrastructure capability a higher layer needs (key-value storage, notifications, audio, clipboard, …)
gets the same treatment — a **port interface** in `src/domain/` (or `src/application/` for purely
app-level services), an implementation in `src/infrastructure/`, wiring in the composition root, and
consumers resolve it via DI. Adding a direct `@infrastructure` import instead is blocking; parking it in
`KNOWN_DEBT` is not an alternative (the list only shrinks, target zero).

### Smart-UI guard (Evans p.57 — CLAUDE.md §18)

Screens that grow unbounded silently become the Smart UI anti-pattern: business rules accumulate in the
component and the domain model stops mattering. Hard limits:

- a routed `index.tsx` composes co-located parts — target ≤ ~200 lines, **zero business rules**;
- any `.tsx` over 300 lines is a blocking review finding (i18n dictionaries `en.ts` / `tr.ts` exempt);
- a business rule discovered while editing UI is moved down (component → hook → store/use case →
  entity/VO) **in the same PR**, never left in place;
- presentation computes nothing the application or domain layer could own: formatting for display is
  fine, validation / eligibility / totals are not.

### OOP & rich domain model (Evans p.65-74 — CLAUDE.md §19)

Object-oriented design is the active paradigm of this codebase, not a formality:

- **Behavior lives with the data.** An invariant or derivation about an entity's own props is a method
  on the entity (or a factory guard), not a helper in a store, component, or util file. Before writing
  `isRecipeX(recipe)` anywhere outside `src/domain/`, put `recipe.isX()` on the entity.
- **Encapsulation is mandatory.** `private` constructor + static `create(): Result<T, ValidationFailure>`,
  `private readonly` fields behind getters, no public setters, no mutation after construction except via
  intention-revealing methods that re-check invariants.
- **Entities stay identity-intrinsic (p.67).** Props describe what the thing *is*, not who is looking at
  it. Viewer-dependent flags (`likedByMe`-style) are tolerated where they already exist but must not be
  extended — new viewer/session-relative data goes into a read model / store state, not entity props.
- **Value Objects for conceptual wholes (p.71).** When a primitive carries rules (format, range, unit) or
  travels as a group (amount + unit, minutes prep + cook), promote it to an immutable VO with a validating
  factory (the `Email` pattern) instead of re-validating raw primitives at multiple call sites.
- **Services stay stateless and verb-named (p.75-76)**, and thin: an application use case coordinates —
  business decisions belong in entities/VOs.

### Aggregates (Evans p.89-93 — CLAUDE.md §20)

Consistency boundaries are documented, deliberate decisions. The server is the transactional authority;
this client still respects the boundaries for references and deletion semantics. Cross-aggregate
references are **by id only**.

| Aggregate root | Members / notes |
|---|---|
| `RecipeEntity` | Root. `RecipeSummaryEntity` is a read model of it (not a separate aggregate). `MediaItem`, `RecipeNutrition` are VO-shaped members. `commentCount` / `likeCount` are server-maintained denormalizations. |
| `CommentEntity` | Own root (own identity + lifecycle); references its recipe by `recipeId`. |
| `UserEntity` | Root (auth identity). |
| `UserProfileEntity` | Own root (profile lifecycle independent of auth session); references `UserEntity` by id. |
| `AuthSessionEntity` | Root (token lifecycle). |
| `NotificationEntity` | Own root; references related entities by id. |

A PR that adds a domain entity MUST add a row here (root or member of which root) — the code-reviewer
blocks otherwise.

---

## Layer Details

### `src/core/`

Framework-agnostic building blocks shared across all layers.

The test for this layer is not "is it shared?" but **"is it a building block?"**. `core/di/`
holds the `Container`, which maps a bare `symbol` to a factory and never learns a single token
name — reusable in any project. The token list itself (`TOKENS`) enumerates *this* app's
repositories, use cases and ports, so it is composition knowledge and lives in
`application/di/tokens.ts`. Same reasoning keeps design tokens out of core (§5a).

| Module | Purpose |
|--------|---------|
| `src/core/result/result.ts` | `Result<T, F>` monad (`ok` / `fail`) for typed error handling |
| `src/core/failure/` | The contract (`Failure` base class, `ErrorMessageKey`, `ValidationFieldError`) at the root; the concrete failures in `kinds/`; barrel `index.ts` |
| `src/core/entity/base-entity.ts` | Base `BaseEntity<Props>` with identity equality |
| `src/core/di/container.ts` | `Container` class (register/resolve with lazy singletons), keyed by a bare `symbol` |
| `src/core/di/container-instance.ts` | Singleton `container` instance |

### `src/domain/`

The heart of the application. Pure TypeScript, no framework dependencies.

- **Entities** — `RecipeEntity`, `AuthSessionEntity`, `UserEntity`, `CommentEntity` extend `BaseEntity<Props>` with factory `create()`
  methods returning `Result`.
- **Value Objects** — e.g. `Email` (self-validating class with a factory `create()` returning `Result`).
- **Enums / Literals** — typed string unions in their own files.
- **Repository Interfaces** — `RecipeRepositoryInterface`, `AuthRepositoryInterface`, `CommentRepositoryInterface` define contracts;
  implementations live in `src/infrastructure/`.

### `src/application/`

Orchestrates domain logic through use cases and manages UI state.

- **Use Cases** — Single-responsibility classes with an `execute(...)` method returning
  `Promise<Result<T, Failure>>`.
- **Stores** — Zustand stores that call use cases and expose state to the presentation layer.
- **DI Registration** — `src/application/di/register.ts` wires use cases and stores into the container.
- **Test Fixtures** — `src/application/__fixtures__/` contains fakes (e.g., `FakeAuthRepository`) for unit tests.

### `src/infrastructure/`

Implements domain interfaces with concrete I/O.

- **Repositories** — `AuthRepository`, `RecipeRepository` implement domain interfaces using `HttpClient`.
- **DTOs** — One interface per file (`RecipeDto`, `RecipesListDto`, …).
- **Mappers** — Pure functions (`toRecipe`, `toUser`) that convert DTOs to domain entities, returning
  `Result`. Mappers are stateless and have no dependencies, so plain exported functions are idiomatic.
  They are typed to the shared function-type contracts in `@core/mapper`: a reconstituting DTO→domain
  mapper is a `Mapper<TDto, TDomain, TFailure>` (returns `Result`); a total input→request-DTO mapper is a
  `RequestMapper<TInput, TDto>` (returns the DTO directly). These are **type aliases, not base classes** —
  mappers never become classes, and infallible field-copy transformers that fit neither contract stay
  plain functions.
- **Paging** — list endpoints return the wire envelope mapped to a page read model
  (`RecipePage`: `items`, `total`, `page`, `hasMore`), not a bare array. Dropping the
  envelope is what let the app request page 1 forever. The page comes from the caller;
  the query is built by a `RequestMapper`, not by the repository method.
- **Network** — `HttpClient` wraps Axios with typed error mapping to `Failure` subclasses.
- **Storage** — `SecureTokenStorage`; platform-specific `kv-store.ts` / `kv-store.web.ts`.
- **Constants** — `src/infrastructure/constants/api.ts` (URLs, limits) and `storage.ts` (storage keys).
- **DI Registration** — `src/infrastructure/di/register.ts` wires repositories and HTTP client.

### `src/presentation/`

All UI and user-facing logic.

- **Pages** — One routed page per folder in `src/presentation/app/{segment}/`. The route component lives in
  `index.tsx` (named export + `export default`), and its parts are co-located in a fixed set of subfolders:
  - `body/` — large view sections or phase views of the screen.
  - `items/` — row / tile / chip / card components rendered in lists or grids.
  - `sheets/` — the shared modal surfaces. `BottomSheet` is the only place that renders a
    modal panel: it presents as a bottom sheet on the mobile shell and as a **centred
    dialog on the web shell**, because a panel glued to the bottom edge of a desktop
    window is a touch idiom (its grabber promises a drag a mouse never performs). Screens
    compose it — they never hand-roll a `Modal`; `check:structure` rule L blocks that.
  - `hooks/` — the page's `use-*` hooks (one hook per file).
  - `model/` — pure TypeScript: types, mappers, constants, and label helpers.
  - `__tests__/` — inside the subfolder that owns the file under test.

  Co-located files MUST live in one of those subfolders (`check:structure` rule E). A dynamic-route
  feature nests its detail page — e.g. `app/recipes/` holds the list page plus `[recipeId]/` (detail
  page) and `shared/` for parts used by both. Root shell files sit at the app root: `_layout.tsx`
  (root layout), `+html.tsx`, `index.tsx` (entry redirect).

  **Route registration** — only `index.tsx`, `_layout.tsx`, `+special` and `[param]` files become routes.
  `metro.config.js` swaps expo-router's catch-all route context for
  `src/presentation/navigation/route-context.js`, whose regex admits only those files; a new page is therefore
  always `app/<segment>/index.tsx` — a flat `app/<segment>.tsx` will NOT register. Static web exports
  still emit stray pages for co-located files (the CLI scans the file system directly), so
  `npm run build:web` runs `scripts/prune-web-export.mjs` afterwards; real pages always export as
  `<segment>/index.html`. Typed-routes generation sees co-located files too, which only loosens the
  generated `Href` union — harmless. Revisit `route-context.js` on every Expo SDK / expo-router upgrade.
- **Navigation (shell)** — `src/presentation/navigation/`: `route-context.js` (router file filter),
  `use-auth-guard.ts`, `use-instagram-share-import.ts`, `alarm-screen.tsx` (global overlay rendered by the
  root layout).
- **Bootstrap** — `AppBootstrap` (DI init + hydration), `StoresProvider` (React context for stores).
**Placement follows consumers.** A module read by exactly one page belongs in that page's folder, not
in `base/`; a module read by two or more pages belongs in `base/`, not inside one of them. The root
layout is not a page, so the global shell chrome it mounts (tab bar, toast host, web header, active
timers bar, splash overlay) correctly stays in `base/widgets/`.

- **Widgets** — Shared UI components in `src/presentation/base/widgets/`, grouped by category folder: `text/`,
  `buttons/`, `cards/`, `sheets/`, `layout/`, `media/`, `feedback/`, `loading/`, `settings/`, `navigation/`,
  `timers/`, `brand/`, `inputs/`, and `web-header/`. A widget used by only one page lives in that page's
  folder, not here.
- **Theme** — `src/presentation/base/theme/`, three folders: `tokens/` (design measurements + the
  device-scaling primitives in `scale.ts`), `colors/` (palettes, `themes.ts`, semantic surfaces) and
  `context/` (the active-theme provider and `use-theme`). Full inventory and naming rules: §5a.
- **Responsive** — `src/presentation/base/responsive/`: viewport breakpoints, the `LayoutProvider` context
  and the web-shell state. Decides *layout* (which arrangement); `theme/tokens/scale.ts` decides
  *measurement* (how big within that arrangement).
- **i18n** — `src/presentation/i18n/en.ts`, `src/presentation/i18n/tr.ts`, `src/presentation/i18n/i18n.ts`.
- **Utils** — `src/presentation/base/utils/`.

---

## Coding Standards

These rules are **mandatory**. Every agent and every human contributor must follow them. The `code-reviewer`
agent must flag any violation as a blocking issue.

---

### 1. One Declaration Per File

Each file contains exactly **one** top-level declaration: one class, one interface, one type alias, one
React component, or one enum. The only exceptions are:

- Barrel `index.ts` files that only re-export.
- A `ComponentNameProps` interface that lives in the same file as its component (it must be named
  exactly `<ComponentName>Props` — see Standard 7).
- A simple helper type that is only meaningful alongside the **class** in the same file (this exception
  is for classes only — it does not cover hooks, stores, or plain functions).
- The merged-enum idiom: a `const X` object plus a same-named `type X` union (and `X_VALUES` arrays),
  or a union type derived via `typeof` from a const in the same file. One concept = one file.
- Constants-only files (`src/infrastructure/constants/api.ts`, `theme/tokens/spacing.ts`, …) and pure-function
  collections with **no** type/interface in the file (mappers, `i18n.ts`, `timer-controls.ts`).

Frequent violations to watch for — all of these must be split:

- A hook's args/result `interface` in the same file as the hook
  (`use-x.ts` keeps the hook; the type moves to its own file — see Placement below).
- A Zustand store type next to its factory: `x-store.ts` holds only `type XStore`;
  the factory lives in `configure-x-store.ts`.
- A provider component and its `use*` hook in one `*-context.tsx` file — the hook gets its own
  `use-x.ts` file (Standard 8).
- Logic helpers embedded in a component file — move them to the page's `model/` folder.

**Placement of extracted declarations:** inside a page folder, pure types go to that page's `model/`;
inside `base/*`, the type becomes a sibling file in the same folder. File name = kebab-case of the
declaration it contains.

```ts
// ✅ recipe-entity.ts — one entity class
export class RecipeEntity extends BaseEntity<RecipeProps> { ... }

// ❌ recipe-entity.ts — two unrelated declarations
export class RecipeEntity extends BaseEntity<RecipeProps> { ... }
export class RecipeMapper { ... }   // move to recipe-mapper.ts
```

---

### 2. Class vs. Function — When to Use Each

Use **classes** for any construct that has constructor dependencies, manages state, or represents a
long-lived object: use cases, repositories, HTTP clients, storage adapters, domain entities.

Use **pure functions** for stateless, dependency-free data transformers (mappers, formatters, validators)
where a class would add no value.

| Construct | Form |
|-----------|------|
| Use case | `class GetRecipeUseCase { execute(...) }` |
| Repository | `class HttpRecipeRepository implements RecipeRepositoryInterface { ... }` |
| HTTP / Storage | `class HttpClient { ... }` / `class SecureTokenStorage { ... }` |
| Domain entity | `class RecipeEntity extends BaseEntity<RecipeProps> { ... }` |
| DTO mapper | `export const toRecipe = (dto: RecipeDto): Result<RecipeEntity, ...> => { ... }` |
| Date formatter | `export const formatDate = (d: Date): string => { ... }` |

Never create a class whose only method is a static or standalone transform — use a plain function instead.

---

### 3. JSDoc on Classes and Non-Obvious Public Methods

Every **class** must have a JSDoc summary. Public methods and exported functions get a JSDoc when the
signature alone does not fully communicate intent, edge cases, or failure modes.

Rules:

- Use `/** ... */` style.
- First line is imperative: "Returns …", "Fetches …", "Validates …".
- Add `@param` / `@returns` only when the type names alone are not enough.
- Do **not** document the trivially obvious (a `constructor`, a one-line getter, a pass-through `execute`).

```ts
/**
 * Retrieves a single recipe by its identifier.
 * Fails with NotFoundFailure when the recipe does not exist on the server.
 */
export class GetRecipeUseCase {
  constructor(private readonly repo: RecipeRepositoryInterface) {}

  // No JSDoc needed — signature is self-explanatory.
  execute(id: string): Promise<Result<Recipe, Failure>> {
    return this.repo.getRecipe(id);
  }
}

/**
 * Maps a raw API DTO to a domain Recipe entity.
 * Promotes the single `image` field into a one-item media gallery so the
 * MediaGallery widget always has data to render.
 */
export const toRecipe = (dto: RecipeDto): Result<Recipe, ValidationFailure> => { ... };
```

---

### 4. Files Must Stay Simple and Focused

A file is too complex when a reader cannot understand its purpose at a glance.

- **Domain entity / value object** — ~80 lines max.
- **Use case / mapper** — ~120 lines max.
- **Screen component** — extract sub-components into the same feature folder when the file grows unwieldy.
  There is no hard line limit for screens because form-heavy screens are inherently large, but each
  logical section (form section, list item, modal) must live in its own sub-component file.
- No nested class definitions anywhere.
- No more than 2 levels of callback nesting inside a method — extract a private helper instead.

#### 4a. Folders must stay scannable — the 10 / 15 rule

The same discipline applies one level up. A folder is a unit of meaning, not a bucket: past roughly
ten sibling files nobody *reads* the folder any more, they grep it, and at that point the folder has
stopped telling you anything. This is not hypothetical — it is exactly how `base/theme/` reached 46
flat files and how the 90-key `sizes` object survived as long as it did.

Two tiers, counting **only the files directly in the folder** (subfolders are the fix, so they are
not part of the count):

| Files | Meaning |
|-------|---------|
| ≤ 10 | Fine. |
| 11–15 | **Soft limit.** `check:structure` prints the folder as a warning. Look for a grouping before adding another file; a reviewer may ask for one. Not blocking. |
| > 15 | **Hard limit — blocking.** Group the related files into subfolders. |

`__tests__/`, `__fixtures__/` and `__mocks__/` are exempt: they mirror the shape of the code they
cover, and splitting them on their own would only decouple them from that shape.

**Why the soft tier exists.** Some flat lists are *forced* by another rule, and splitting those on
a script's say-so would invent fake categories. `core/failure/` reached 14 files purely because
Standard 1 puts one `Failure` subclass in each; a blanket "max 10" would have flagged it on day one
and taught everyone to ignore the check. Reviewed by a human, it did turn out to have an honest
split — the contract (base class + the two shapes it carries) at the root, the catalogue of concrete
failures in `kinds/` — but that is a judgement about meaning, not something a file count can make.
So the soft tier prompts that judgement and the hard tier encodes the point where no arrangement of
contents is scannable any more.

**How to split.** Group by what the files are *for*, never by what they *are*. `theme/tokens/`
became `sizing/` + `typography/` + `effects/`, not `objects/` + `functions/`; a page's crowded
`model/` becomes `taxonomy/` + `validation/` + `drafting/`, not `types/` + `helpers/`. The
same rule as §13a: capability, not kind. If no honest grouping exists, that is usually a sign the
folder holds two unrelated concerns and one of them belongs somewhere else entirely.

---

### 5. Constants — No Magic Values in Business Logic

Hardcoded numbers, strings, colours, and sizes are forbidden outside dedicated constants files.

#### Where constants live

| Constant type | File |
|---------------|------|
| Empty string, separators (`,`, `.`, `/`, `\n`) | `src/core/constants/char-constants.ts` |
| Structural numbers (`0`, `1`, `2`, `-1`) | `src/core/constants/value-constants.ts` |
| Regexes shared by more than one file | `src/core/constants/regex-constants.ts` |
| Locale codes (`en`, `tr`) | `src/core/constants/locale-constants.ts` |
| API endpoints, page sizes, timeouts | `src/infrastructure/constants/api.ts` |
| Storage keys | `src/infrastructure/constants/storage.ts` |
| Any design measurement (spacing, size, opacity, tracking, z-order, …) | `src/presentation/base/theme/` — see §5a |
| Colour palettes (light & dark) | `src/presentation/base/theme/colors.ts` / `themes.ts` |
| A value only one page reads | that page's `model/` folder |
| A value only one shared widget reads | a sibling file next to the widget |

```ts
// ✅ correct
import { spacing, fontSizes } from '@presentation/base/theme';
import { colors } from '@presentation/base/theme/themes';

const styles = StyleSheet.create({
  title: { fontSize: fontSizes.title, marginBottom: spacing.md },
  card:  { backgroundColor: colors.card },
});

// ❌ wrong — magic numbers and hex codes inline
const styles = StyleSheet.create({
  title: { fontSize: 24, marginBottom: 12 },
  card:  { backgroundColor: '#F5F5F5' },
});
```

#### `@core/constants` — named literals (default for all new code)

`src/core/constants/` homes literals whose meaning is **structural**, not visual. It imports
nothing (core may only import `@core`), so every layer may consume it — always through the
barrel, never a deep path.

```ts
import { CharConstants, ValueConstants, RegexConstants } from '@core/constants';

// ✅ correct
const [name, setName] = useState(CharConstants.empty);
if (items.length === ValueConstants.zero) return null;
const first = parts[ValueConstants.zero];
const padding = ValueConstants.zero;

// ❌ wrong — bare structural literals
const [name, setName] = useState('');
if (items.length === 0) return null;
```

**What does NOT belong here** — putting a measurement in `ValueConstants` is a review finding:

- Design measurements (spacing, radii, font/icon sizes, opacity) → `theme/` (§5a).
  `layoutSizes.homeHeaderMin` stays a bare `0` because it is a measurement sitting beside `132` and `96`.
- API limits, page sizes, timeouts → `infrastructure/constants/api.ts`.
- Arbitrary numbers. `ValueConstants` holds `zero`/`one`/`two`/`minusOne` only — never add `20`.
- Feature-local regexes (ingredient parsing, route matching) stay next to the code that owns them.
  Only a pattern that would otherwise be **re-declared in two files** is promoted to `RegexConstants`.

#### Two invariants that will break the build if ignored

**1. `CharConstants` / `ValueConstants` values are deliberately widened** — written `'' as string`
and `0 as number` inside the `as const` object. These assertions are **not** redundant and must
never be "cleaned up". Without them the properties get literal types (`''`, `0`), which infects
every call site relying on widening: `useState(ValueConstants.zero)` infers `useState<0>`, so any
later `setX(someNumber)` fails to compile. This hit ~42 sites during the original migration.

`LocaleConstants` and `RegexConstants` intentionally keep their literal types — the `'en' | 'tr'`
unions and narrowing depend on them. Do not widen those.

**2. No `g` or `y` flag in `RegexConstants`.** The patterns are shared module-level instances;
a global/sticky RegExp carries `lastIndex` between calls, so two unrelated call sites would
silently corrupt each other's matches. A pattern needing `g` is constructed per use.

#### No literal sequences in components

A raw array of numbers in a component or service is a magic value — including when only part of it
looks meaningful. **Name the whole sequence** in a constants file; do not half-substitute it.

```tsx
// ❌ wrong — raw sequence inline
locations={[0, 0.45, 0.8, 1]}
vibrationPattern: [0, 500, 300, 500, 300, 500],

// ❌ also wrong — half-named, hides the pattern the neighbours form
locations={[ValueConstants.zero, 0.45, 0.8, 1]}

// ✅ correct — the sequence is named where it is defined
locations={HeroGradientConstants.locations}
vibrationPattern: [...ALARM_VIBRATION_PATTERN],
```

Where a count drives the sequence, derive it instead of listing it:
`Array.from({ length: PASSWORD_STRENGTH_SEGMENTS }, (_, i) => …)`.

#### `presentation/base/constants/` — cross-cutting UI values only

UI-specific values do **not** go in `@core/constants` (core is framework-free and shared by every
layer). The genuinely cross-cutting ones live in `src/presentation/base/constants/`, consumed via
the `@presentation/base/constants` barrel:

| File | Holds |
|------|-------|
| `animation-constants.ts` | Driver ranges for `interpolate()` / `interpolateColor()` |
| `route-paths.ts` | Every in-app expo-router navigation target |

Scalars here carry `as number` / `as string` for the same reason as `@core/constants` — see the
widening invariant above.

**The test for this folder is REUSE, not type.** A number is not "a constant" because it is a
number. Before adding a file here, count the consumers:

- More than one feature reads it, and it is not a measurement → this folder.
- It is a measurement of any kind → `theme/` (§5a), never here.
- Exactly one page reads it → that page's `model/` folder
  (`app/register/model/password-strength-segments.ts`).
- Exactly one shared widget reads it → a sibling file next to that widget
  (`base/widgets/cards/recipe-card-tag-limit.ts`).

This folder previously held a `PresentationValueConstants` grab-bag whose three members were read
by three unrelated features, and a gradient's stop geometry whose matching colours lived two layers
away in `app/recipes/model/`. Both are the same failure: a shared bag makes an unshared value look
shared, and splits things that only make sense together.

**Layer check before choosing a home.** `presentation/base/constants` is unreachable from
`domain`, `application` and `infrastructure` (`ALLOWED_IMPORTS` in `scripts/check-structure.mjs`).
A value used by a repository or service goes in `src/infrastructure/constants/` instead — this is
why the alarm vibration pattern lives in `infrastructure/constants/notifications.ts`.

**Readonly arrays and native APIs.** Export sequences as `readonly`, and spread at the call site
(`[...ALARM_VIBRATION_PATTERN]`) when the consumer demands a mutable `number[]` — several
Expo/React Native props do. Never widen the constant to mutable just to satisfy a call site: that
turns it into shared state a native module can write through.

---

### 5a. Design Tokens & Responsive Sizing

`src/presentation/base/theme/` is split into three folders by what a file is *for*:

| Folder | Answers | Contents |
|--------|---------|----------|
| `tokens/` | "how big / far apart / opaque / deep?" | every design measurement, plus `scale.ts` |
| `colors/` | "what colour?" | palettes, `themes.ts`, contrast helpers, severity surfaces |
| `context/` | "which theme is active?" | the theme provider, its types, `use-theme` |

A hook lives beside the thing it serves — `use-theme` in `context/`, `use-text-line-height` in
`tokens/` — rather than in a `hooks/` dump, so the folder a file sits in still answers "what is this
for?". The `@presentation/base/theme` barrel re-exports the token and colour **values** a component
consumes; hooks, contexts and theme definitions keep their own import paths, so pulling in a spacing
number never drags a React context along with it.

Design tokens are **lowercase** objects (`spacing`, `iconSizes`, `opacities`); `*Constants`
PascalCase objects are reserved for non-design literals. That casing is the fastest signal of which
of the two vocabularies you are reading.

**Why these are not in `src/core/`** — the question comes up because a type scale looks reusable
enough to be "shared". Reusability is not what `core` is for; **dependency direction** is. `core` is
the innermost layer, imports nothing (`ALLOWED_IMPORTS.core === ['@core']`) and is imported by
`domain` and `infrastructure` — so a token placed there is a token a repository is allowed to read,
which is precisely the inward pull Clean Architecture exists to stop. Concretely it would also drag
React Native inward: `font-sizes.ts` → `scale.ts` → `Dimensions`/`PixelRatio`/`Platform`, into a
layer whose only imports today are its own files. If these tokens ever need to be shared across
*projects*, that is a published design-system package, not `src/core/`.

Everything below lives in `tokens/`:

| Module | Holds | Device-scaled? |
|--------|-------|----------------|
| `spacing.ts` | The one gap ladder — margins, paddings, `gap` | yes |
| `radii.ts` | Corner radii (`round` is the pill sentinel) | yes, except `round` |
| `font-sizes.ts` | The type scale, role-named | yes, at half strength |
| `font-weights.ts` | Weight ladder `regular` → `heavy`; literal types, never widened | n/a |
| `line-heights.ts` | Line-box **multipliers** — never absolute points | n/a (ratios) |
| `letter-spacings.ts` | Tracking ladder, `ultraTight` → `wider` | no |
| `icon-sizes.ts` | Glyph sizes, strict t-shirt ladder | yes |
| `control-sizes.ts` | Boxes the user taps or types into | yes |
| `avatar-sizes.ts` | Avatar diameters + ring frames | yes |
| `media-sizes.ts` | Image / thumbnail / hero boxes | yes |
| `decor-sizes.ts` | Non-interactive ornament (badges, discs, dots) | yes |
| `layout-sizes.ts` | Content caps, column gaps, sticky offsets | **no** — see below |
| `aspect-ratios.ts` | `width / height` ratios for media boxes | n/a |
| `border-widths.ts` | Stroke weights and hairline dividers | **no** |
| `opacities.ts` | Named alpha levels | n/a |
| `color-alphas.ts` | Hex alpha suffixes for tinting a theme colour | n/a |
| `z-indices.ts` | The app's whole stacking order | n/a |
| `max-font-scales.ts` | `maxFontSizeMultiplier` caps — last resort only | n/a |
| `shadows.ts` | The elevation ladder | offsets/blur only |

#### Naming rules inside a token module

1. **Scales are t-shirt ladders; components are role-named.** `iconSizes`, `spacing` and `radii`
   name a position on a scale (`xs` → `illustration`), because nothing about a 16pt glyph says what
   it is for. `controlSizes` names the control (`button`, `input`, `chip`), because a control size
   is chosen by what the control *is*, and two controls that share a number today must be able to
   diverge tomorrow without dragging the other with them.
2. **A ladder must be monotonic and complete.** The previous `sizes` bag had `iconXxs` (18) larger
   than `iconSm` (16) — names that cannot be ordered are names that cannot be reviewed. If a new
   value breaks the ordering, the ladder is wrong, not the value.
3. **Opacity suffixes grade the EFFECT, not the number.** Within a family
   (`pressed*`, `disabled*`, `onMedia*`, `scrim*`) the order is
   `Faint < Subtle < Light < (default) < Strong`, where `Faint` always has the weakest visible
   effect. That holds whether the effect is a lower alpha (dimming) or a higher one (a scrim). The
   old set had `disabledStrong` (0.6) dimming *less* than `disabled` (0.5) while `pressedStrong`
   (0.7) dimmed *more* than `pressed` (0.75) — the same suffix meaning opposite things in
   neighbouring families.
4. **Reuse the nearest step before adding one.** A 15pt and a 16pt glyph are not a distinction
   anyone can see; they are two names for one decision.

#### Device scaling

`tokens/scale.ts` reads the device's **shortest** viewport edge once at module load and derives a
factor against a 375pt baseline, clamped to `[0.9, 1.12]`. `scale()` applies it to layout
measurements; `scaleFont()` applies half of it to type, because the OS accessibility font scale
multiplies on top of whatever we emit.

- **Shortest edge, not width** — the factor must be orientation-independent, or rotating a phone
  would resize every control on screen.
- **Neutral on web** — the web build adapts through breakpoints, and a desktop viewport would
  otherwise inflate the entire UI. A module-load read cannot follow a browser resize anyway.
- **Not everything scales.** `layoutSizes` (max-widths, breakpoint-ish thresholds) are properties
  of the *viewport*, not of the device — scaling them would fight
  `base/responsive/breakpoints.ts`, which is the component that decides layout at that altitude.
  `borderWidths` stay unscaled so a hairline stays a hairline instead of a blurry 1.12px.

#### Sizing rules in components

1. **`minHeight`, not `height`, on anything containing text.** A pinned height is only correct for
   a *shape* — a circular icon button, an avatar, a media box. The moment a box holds a label it
   has to grow: labels wrap, Turkish is longer than English, and the OS font scale multiplies the
   glyphs but not the box.
2. **Never write an absolute `lineHeight`.** React Native multiplies `fontSize` by the system font
   scale at render time and leaves `lineHeight` exactly as written, so `lineHeight: 22` stops
   containing its own glyphs as soon as the user turns text size up. Use `useTextLineHeight` for
   rendered text (it re-derives from the live `fontScale`) or `lineHeightFor` inside a
   `StyleSheet.create()` entry.
3. **Prefer `aspectRatio` to a pinned image height.** A ratio follows whatever width the column
   gives it; a height only ever matches one screen. Pair it with a `mediaSizes` cap when a wide
   container would otherwise push the content below the fold.
4. **Multi-line fields use `AutoGrowTextInput`** (`base/widgets/inputs/`), never a bare
   `multiline` `TextInput` with a fixed height. react-native-web renders `multiline` as a real
   `<textarea>`, which does not grow with its content — it keeps its box and puts a scrollbar down
   the side. The web half of that platform pair measures and resizes the element itself.
5. **`maxFontSizeMultiplier` is a last resort.** It stops honouring the user's accessibility
   setting, so it is only for text inside a shape that genuinely cannot grow (digits in a
   fixed-diameter badge). Everywhere else, make the box flexible instead.

---

### 6. React Native — Styles

- **Always use `StyleSheet.create()`** for static style objects. Inline style objects (`style={{ margin: 8 }}`) are forbidden for static values because they create a new object on every render.
- **Dynamic styles** (values that depend on runtime state or theme) may use inline objects only for the
  dynamic portion. Static portions must still live in `StyleSheet.create()`.
- Combine static and dynamic styles with an array: `style={[styles.base, { backgroundColor: color }]}`.

```tsx
// ✅
const styles = StyleSheet.create({ container: { flex: 1, padding: spacing.md } });
<View style={[styles.container, { backgroundColor: theme.colors.background }]} />

// ❌
<View style={{ flex: 1, padding: 16, backgroundColor: theme.colors.background }} />
```

---

### 7. React Native — Component Props Interface

- Every React component's props must be typed with an interface named `ComponentNameProps`.
- Export the `Props` interface so callers can reference it.
- Place the interface directly above the component function in the same file.

```tsx
// ✅
export interface RecipeCardProps {
  recipe: Recipe;
  onPress: (id: string) => void;
}

export const RecipeCard = ({ recipe, onPress }: RecipeCardProps): React.JSX.Element => { ... };
```

---

### 8. React Native — Custom Hooks

- Custom hooks must be named with the `use` prefix (`useRecipeList`, `useTheme`).
- A custom hook file must export exactly one hook function — and nothing else that is a component,
  class, interface, or type alias. In particular a context's provider component and its consumer hook
  live in **separate** files (`theme-context.tsx` + `use-theme.ts`).
- Hooks that depend on a store must accept no arguments and read the store internally; they must not
  accept store state as props.
- Hooks are thin adapters over application stores / use cases: view-facing glue only, no business
  rules (those belong in `src/domain/`, orchestration in `src/application/`).

---

### 9. React Native — Lists

- `FlatList` and `SectionList` must always declare a `keyExtractor` prop that returns a stable, unique key.
- Never use the array index as a key for mutable lists.

```tsx
// ✅
<FlatList keyExtractor={(item) => item.id} ... />

// ❌
<FlatList keyExtractor={(_, index) => String(index)} ... />
```

---

### 10. React Native — Accessibility

Every interactive element (`Pressable`, `TouchableOpacity`, button widget) must declare at minimum:

- `accessibilityRole` — describes the element type (`"button"`, `"link"`, `"checkbox"`, …).
- `accessibilityLabel` — human-readable description when the visual label is not text.

---

### 11. Internationalization (i18n)

- All user-visible strings in `src/presentation/` must come from `t()` (never hardcoded).
- Translation files: `src/presentation/i18n/en.ts` (English), `src/presentation/i18n/tr.ts` (Turkish).
- Locale detection via `expo-localization` at app startup (`initLocale()`).
- Both languages must remain in sync at all times — adding a key to `en.ts` requires the same key in
  `tr.ts` in the same commit.

---

### 12. Error Handling — `Result<T, Failure>`

- Use `Result<T, Failure>` everywhere; never throw exceptions in domain or application code.
- Domain `create()` factory methods return `Result<Entity, ValidationFailure>`.
- Infrastructure maps HTTP errors to typed `Failure` subclasses (`NetworkFailure`,
  `UnauthorizedFailure`, `NotFoundFailure`, `UnknownFailure`).
- `src/presentation/` may `throw` only inside error boundaries.

---

### 13a. Feature Folders in domain / application / infrastructure

A feature folder is grouped **by capability**, never left as one flat pile of files. Once a
feature folder passes roughly a dozen files, split it: each capability gets its own folder
holding everything that capability needs — use case, state, store, deps, DTOs, mappers — plus
its own `__tests__/`.

```
src/application/recipes/
  create/      create-recipe-use-case.ts, create-recipe-state.ts
  generate/    generate-recipe-{input,state,use-case}.ts, __tests__/
  detail/      recipe-detail-{state,store,store-deps,store-state}.ts,
               configure-recipe-detail-store.ts, get-recipe-use-case.ts
  list/        recipe-list-*.ts, list-recipes-use-case.ts, __tests__/
  taxonomy/    taxonomy-*.ts, load-taxonomy-use-case.ts, __tests__/
```

Rules:

- **Group by capability, not by kind.** `create/` and `list/`, never `use-cases/`, `stores/`,
  `states/` — grouping by kind just reproduces the flat pile one level down.
- **What the aggregate root owns stays at the feature root.** In `domain/recipes/` the entity,
  its summary and its repository interface stay put; only the capability-specific types move
  into `create/`, `media/`, `taxonomy/`, … The same applies to `recipe-repository.ts` and
  `recipe-mapper.ts` in infrastructure.
- **The same capability name is used across layers.** `create/`, `refine/`, `taxonomy/` and
  `media/` mean the same thing in `domain/`, `application/` and `infrastructure/`.
- **Capability-internal `dtos/` / `mappers/` subfolders — only at ≥2.** Within a folder
  (a capability folder or a not-yet-split flat feature root), once it holds **two or more**
  DTO files, move them into a `dtos/` subfolder; likewise `mappers/` for two or more mappers.
  A single DTO or mapper stays flat at the folder root — never create a one-file folder. This
  is by-capability on the outside, by-kind only on the inside, and only when the count earns it
  (e.g. `infrastructure/recipes/dtos/`, `infrastructure/recipes/taxonomy/dtos/`). Repositories
  are one-per-feature, so no `repositories/` subfolder.
- **Tests move with their subject** into that capability's `__tests__/`.
- **No barrel `index.ts` per capability.** Imports stay explicit deep paths
  (`@application/recipes/list/recipe-list-store`), which keeps the layer graph readable and
  avoids import cycles between capabilities.

### 13. Testing

- Tests live next to the code they test in `__tests__/` directories.
- Domain and core tests are pure unit tests — no mocks, no external I/O.
- Application tests use fakes (`FakeAuthRepository`) for repository dependencies.
- Infrastructure mapper tests validate DTO-to-entity mapping with known fixture data.
- Test runner: Jest via `jest-expo`.

---

## Pre-Commit Quality Gate

A pre-commit hook (Husky + lint-staged) runs automatically on every `git commit`:

1. **lint-staged** — runs `eslint --fix` on every staged `.ts` / `.tsx` file. Commit is blocked if any
   ESLint error remains after auto-fix.
2. **TypeScript** — runs `tsc --noEmit` against the full project. Commit is blocked on any type error.
3. **Structure** — runs `npm run check:structure` (`scripts/check-structure.mjs`). Commit is blocked on:
   - one-declaration-per-file / one-hook-per-file violations (Standards 1 and 8),
   - layer-dependency violations (Dependency Rule) beyond the sanctioned exceptions and the shrinking
     `KNOWN_DEBT` list,
   - relative imports (`./`, `../`) outside barrel `index.ts` files — use the `@layer/...` alias,
   - loose files at the `src/presentation/base/widgets/` root (category folders only),
   - entity-naming violations (rule G): a class extending `BaseEntity` must be named `*Entity` and live
     in a `*-entity.ts` file (CLAUDE.md §21). The companion `*Type` suffix for bare type aliases is a
     judgment call, so it is enforced by `code-reviewer`, not this gate.
   - a stale or missing `PROJECT-MAP.md` (rule J): the generated map carries a fingerprint of
     every folder and file name under `src/`, so an index that no longer describes the tree fails
     the gate instead of quietly misleading the next reader. Fix with `npm run map`.
   - folder file-count violations (rule I, CLAUDE.md §14c): more than 15 files directly in one folder.
     Folders in the 11-15 band are printed as a non-blocking warning instead.
   - responsive-sizing violations (rule H, CLAUDE.md §6b): an absolute `lineHeight` literal, or a bare
     `<TextInput multiline>` outside the `AutoGrowTextInput` pair. Both are invisible in a normal
     simulator run — the first only clips at a large OS font scale, the second only shows its scrollbar
     on the web build — which is exactly why they are mechanical checks rather than review notes. The
     remaining §5a rules (`minHeight` over `height`, `aspectRatio` over pinned image heights, token
     placement) need judgment and stay with `code-reviewer`.

No task is "done" until `npm run lint`, `npx tsc --noEmit`, `npx jest`, **and** `npm run check:structure`
are all green.

To bypass in an emergency: `git commit --no-verify` (use sparingly; document why in the commit message).

---

## External Dependencies

| Package | Purpose |
|---------|---------|
| `expo` (SDK 54) | Framework |
| `expo-router` | File-based routing |
| `expo-localization` | Device locale detection |
| `expo-secure-store` | Secure key-value storage (native) |
| `expo-web-browser` | In-app browser for external links |
| `axios` | HTTP client |
| `zustand` | State management |
| `husky` | Git hooks management |
| `lint-staged` | Run linters only on staged files |

---

## External API

DummyJSON (`https://dummyjson.com`) — free, public, zero configuration.

- Auth: `POST /auth/login`
- Recipes: `GET /recipes`, `GET /recipes/:id`
- Todos: `GET /todos`, `GET /todos/:id`
