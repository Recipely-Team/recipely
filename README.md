<div align="center">

<img src="assets/images/icon.png" width="112" alt="Recipely" />

# Recipely

**One codebase. iOS, Android and the web.**
A recipe app that puts the recipe first — and writes one for you when you only have a video.

[![Expo SDK 55](https://img.shields.io/badge/Expo-SDK%2055-000020?logo=expo&logoColor=white)](https://expo.dev)
[![React Native 0.83](https://img.shields.io/badge/React%20Native-0.83-61DAFB?logo=react&logoColor=black)](https://reactnative.dev)
[![React 19.2](https://img.shields.io/badge/React-19.2-149ECA?logo=react&logoColor=white)](https://react.dev)
[![TypeScript strict](https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Tests](https://img.shields.io/badge/tests-1542%20in%20184%20suites-3FB950)](#testing)
[![Architecture](https://img.shields.io/badge/DDD%20%2F%20Clean%20Architecture-17%20mechanical%20rules-8957E5)](#quality-gates)
[![License AGPL-3.0](https://img.shields.io/badge/license-AGPL--3.0-lightgrey)](#license)

[**recipely.net**](https://recipely.net) · [About](https://recipely.net/about) · [dev.recipely.net](https://dev.recipely.net)

</div>

---

<table>
<tr><td width="50%" valign="top">

### What it is

Recipely lets you **discover** recipes, **generate** new ones with AI — from a prompt or an
imported Instagram video — **cook along** with timers that live inside the step that mentions them,
and keep your own collection.

It talks to a first-party backend at `api.recipely.net`, ships to the App Store and Play Store, and
deploys the same source to `recipely.net` as a static web export.

</td><td width="50%" valign="top">

### At a glance

| | |
|---|---|
| **Platforms** | iOS · Android · Web |
| **Shells** | Mobile + a real desktop shell |
| **Languages** | 9 selectable · 14 catalogues |
| **Backend** | [`recipely-backend`](https://api.recipely.net) (separate repo) |
| **Architecture** | DDD on Clean Architecture, 5 layers |
| **Enforcement** | 17 mechanical rules + 4 gates |

</td></tr>
</table>

---

## Table of contents

<table>
<tr>
<td valign="top">

**Understanding it**
- [Purpose & scope](#purpose--scope)
- [Features](#features)
- [Tech stack](#tech-stack)
- [Architecture](#architecture)
- [Repository layout](#repository-layout)

</td>
<td valign="top">

**Working on it**
- [Getting started](#getting-started)
- [Build variants](#build-variants)
- [Quality gates](#quality-gates)
- [Testing](#testing)

</td>
<td valign="top">

**Shipping it**
- [Observability](#observability)
- [CI/CD](#cicd)
- [Conventions cheat-sheet](#conventions-cheat-sheet)
- [Documentation map](#documentation-map)

</td>
</tr>
</table>

---

## Purpose & scope

> **The problem.** Recipes online are optimised for ad impressions, not for cooking. You scroll past
> a life story to reach the ingredients, you lose your place mid-step, and you have no good way to
> keep the handful of recipes you actually make.

**What Recipely does.** It puts the recipe first: ingredients and steps as checklists, timers that
live inside the step that mentions them, and a personal collection that follows you across devices.
If a recipe only exists in your head or in a video someone sent you, the AI generator turns it into
a structured recipe you can edit and save.

<details open>
<summary><b>In scope</b></summary>

- Recipe discovery, search, filtering and sorting; detail view with ingredients, steps and photos.
- Authoring: manual creation, AI generation from a prompt, and import from an Instagram video
  (server-side transcription + vision).
- Cooking aids: ingredient checklists, step completion, inline countdown timers with alarms.
- Social surface: likes, saves, comments, notifications, public profiles.
- Accounts: email/password, Google and Apple sign-in, password reset, account deletion.
- A full responsive web build with its own desktop shell and SEO-indexable public pages.

</details>

<details>
<summary><b>Out of scope</b> — deliberately, for now</summary>

- Meal planning, shopping lists and pantry tracking.
- Offline-first sync — the app reads from the network and caches in memory; it is not a local-first
  database.
- Nutrition as medical guidance: values are informational and come from the source data.
- Real-time collaboration or messaging between users.

</details>

---

## Features

| Area | What it covers |
|------|----------------|
| 🔍 **Discover** | Collapsing home feed, cuisine strip, trending rail, search, filter & sort, AI banner. Guests can browse without an account. |
| 📖 **Recipe detail** | Photo gallery, ingredient checklist, numbered steps with inline timers, nutrition card, author card, comments, likes, saves, share sheet. |
| ✍️ **Authoring** | Multi-phase editor (prompt → generating → preview → edit), AI refine chat, media picker, taxonomy pickers, draft autosave and resume. |
| 📷 **Instagram import** | Share a reel into the app; a worker transcribes and reads the video, and hands back a draft recipe. |
| 🗂️ **My recipes** | Own recipes and saved recipes in one place, plus resumable drafts. |
| ⏱️ **Timers** | Named per-step countdowns, a docked active-timers bar, notifications, and a full-screen alarm takeover. |
| 👤 **Account** | Email/password, Google, Apple; verification codes, password reset, profile editing, avatar upload, soft-delete account removal. |
| 🔔 **Notifications** | In-app centre with unread badges, push registration, deep links back into the app. |
| 🎨 **Personalisation** | Multiple themes with light/dark variants, EN/TR language switch, contrast-checked palettes. |
| 🖥️ **Web** | Desktop shell with its own header, grids and two-column recipe detail; static export with SEO metadata and public legal pages. |

---

## Tech stack

| Concern | Choice | Version / note |
|---------|--------|----------------|
| Framework | **Expo** | SDK 55 |
| Runtime | **React Native** | 0.83 · New Architecture (Fabric) |
| UI library | **React** | 19.2 |
| Language | **TypeScript** | strict mode |
| Routing | **expo-router** | file-based, with a custom route context |
| State | **Zustand** | 5 |
| HTTP | **Axios** | + AES-256-GCM request envelope |
| Web renderer | **react-native-web** | 0.21 |
| Animation | **react-native-reanimated** | 4 |
| Vector art | **react-native-svg** | 15 |
| Auth / analytics / crash | **Firebase** (native + web SDKs) | Google & Apple sign-in, Crashlytics |
| i18n | **expo-localization** + in-repo dictionaries | 9 selectable, 5 more translated and awaiting an RTL/CJK pass |
| Testing | **Jest + jest-expo** | 1542 tests across 184 suites |
| Tooling | ESLint (`eslint-config-expo`), Husky, lint-staged | |
| CI/CD | GitHub Actions → Play internal track, TestFlight, Firebase Hosting | |

---

## Architecture

Five layers. **Each layer may only import from layers below it** — enforced mechanically, not by
convention.

```
┌─ presentation ── UI, routing, theme, i18n, widgets
│    ↓
├─ application ─── use cases, Zustand stores, DI registration
│    ↓
├─ domain ──────── entities, value objects, repository & port interfaces (pure TypeScript)
│    ↓
├─ infrastructure  repository implementations, DTOs, mappers, HTTP, storage, Firebase
│    ↓
└─ core ────────── Result, Failure hierarchy, BaseEntity, DI container (imports nothing)
```

The parts that are easy to get wrong:

- **`domain` never imports a framework.** Entities use a private constructor plus a static
  `create(): Result<T, Failure>`, so an invalid entity cannot be constructed at all.
- **`infrastructure` is reached only through ports.** Storage, notifications, audio and the rest sit
  behind interfaces declared in `domain`/`application` and resolved through the DI container. The
  presentation layer may not import `@infrastructure`; the only sanctioned exceptions are
  `infrastructure/constants/*` and the composition root.
- **Errors are values.** `Result<T, Failure>` throughout domain and application code — no thrown
  exceptions for expected failure.
- **Aggregates are documented.** Cross-aggregate references are by id only, and every entity is
  listed as root-or-member in the table in [`architecture.md`](architecture.md).

### Presentation anatomy

`src/presentation/app/` is both the expo-router root and where pages live. Only `index.tsx`,
`_layout.tsx`, `+special` and `[param]` files register as routes — a custom route context
(`presentation/navigation/route-context.js`, wired through `metro.config.js`) hides everything else,
so a page's parts can be co-located with it:

```
app/recipes/
  index.tsx      the route itself — composition only, no business rules
  body/          large view sections
  items/         rows, tiles, chips, cards → grouped: filters/ hero/ cards/ banners/
  sheets/        bottom sheets and modals
  hooks/         the page's use-* hooks
  model/         pure TypeScript: types, mappers, labels
  shared/        parts used by this page and its nested detail page
  [recipeId]/    nested detail page, same anatomy
```

> [!NOTE]
> That custom context replaces a framework-owned module, so it inherits every use the framework has
> for it — including looking `+native-intent` up by key to find `redirectSystemPath`. Rule **Q**
> exists because hiding that file once unplugged the iOS share extension in complete silence.

### Design system

`presentation/base/theme/` is split by what a file is *for*:

- **`tokens/`** — every design measurement, one module per purpose (`sizing/`, `typography/`,
  `effects/`), plus `scale.ts`, which adapts measurements to the device.
- **`colors/`** — `palette/` (raw palettes and themes), `surfaces/` (what a colour *means*: severity,
  error, variant semantics), `contrast/` (WCAG contrast maths).
- **`context/`** — which theme is active at runtime, and how a component reads it.

Sizing is responsive by construction: measurements scale from a 375pt baseline against the device's
shortest edge (clamped, neutral on web), boxes containing text use `minHeight` rather than `height`,
and line heights are derived from font size so text survives the OS accessibility font scale. Full
rules in [`architecture.md` §5a](architecture.md).

---

## Repository layout

```
index.js           entry point — installs the crash net, then hands off to expo-router
src/
  presentation/    UI — app/ (pages), base/ (widgets, theme, hooks), navigation/, i18n/, bootstrap/
  application/     use cases, stores, DI registration, test fixtures
  domain/          entities, value objects, repository & port interfaces
  infrastructure/  repository impls, DTOs, mappers, HTTP client, storage, Firebase, crypto
  core/            Result, Failure, BaseEntity, the DI Container, named literals
assets/            images, fonts, sounds (reached via @assets/*)
public/            static web assets (about page, legal pages)
plugins/           Expo config plugins (splash force-dark, release signing, R8, iOS dSYM upload)
scripts/           check-structure, generate-map, prune-web-export, apply-variant-robots
.github/workflows/ ci.yml — the whole pipeline
```

Path aliases: `@core/*`, `@domain/*`, `@application/*`, `@infrastructure/*`, `@presentation/*`,
`@assets/*`, `@/*` (repo root). Relative imports are allowed only inside barrel `index.ts` files.

> [!TIP]
> **Looking for where something lives?** [`PROJECT-MAP.md`](PROJECT-MAP.md) is a generated ~1k-token
> index of the whole tree, and `check:structure` fails while it is stale — so it is never wrong.

---

## Getting started

### Prerequisites

- **Node.js 20+** (CI runs 20) and npm
- Xcode 16+ for iOS; Android Studio with JDK 17 for Android
- A `.env.local` for anything that talks to a real service

### Install

```bash
npm install
```

### Environment

Create `.env.local` in the repo root. Everything is `EXPO_PUBLIC_*` because it is read on the client:

```bash
EXPO_PUBLIC_API_BASE_URL=            # optional — overrides the per-variant default
EXPO_PUBLIC_API_AES_KEY=             # 32-byte hex; must match the backend's API_AES_KEY
EXPO_PUBLIC_WEB_APP_URL=             # optional — canonical web origin for share links
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=    # Firebase → Auth → Google sign-in
EXPO_PUBLIC_FIREBASE_API_KEY=
EXPO_PUBLIC_FIREBASE_APP_ID=
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=
EXPO_PUBLIC_FIREBASE_PROJECT_ID=
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID=
EXPO_PUBLIC_FIREBASE_VAPID_KEY=      # web push only
```

> [!WARNING]
> The AES key ships inside the binary and is extractable by reverse engineering. It hardens the
> request envelope; TLS is what actually protects the transport.

### Run

```bash
npm start            # Expo dev server (production backend)
npm run start:dev    # …against the dev backend

npm run web          # web in a browser
npm run ios          # prebuild + run on a simulator/device
npm run android
```

`.vscode/launch.json` ships ready-made profiles: *Recipely: Expo (Dev/Prod)* and
*Recipely: Web (Dev/Prod)*.

---

## Build variants

`APP_VARIANT` selects the whole environment at config-evaluation time — bundle identifier, display
name, URL scheme, Firebase config and backend host — so both variants can live on one device.

| | development | production |
|---|---|---|
| Display name | Recipely (Dev) | Recipely |
| Android package | `com.recipely.app.dev` | `com.recipely.app` |
| iOS bundle id | `net.recipely.app.dev` | `net.recipely.app` |
| URL scheme | `recipely-dev` | `recipely` |
| API | `dev-api.recipely.net` | `api.recipely.net` |
| Web | `dev.recipely.net` | `recipely.net` |

---

## Quality gates

Four checks. **Work is not done until all four are green.**

```bash
npm run lint             # ESLint (expo config) — zero errors
npm run typecheck        # tsc --noEmit, strict
npm test                 # Jest
npm run check:structure  # architectural rules (also checks PROJECT-MAP.md is fresh)
npm run map              # regenerate PROJECT-MAP.md after moving files
```

`check:structure` ([`scripts/check-structure.mjs`](scripts/check-structure.mjs)) is what keeps the
architecture from drifting. It is not a linter — it encodes the rules a linter cannot see, and most
of them were added the day a bug proved they were needed:

| Rule | Enforces |
|:---:|------|
| **A** | One class / interface / type / component per file; one hook per file |
| **B**, **C** | Layer dependency direction; `@layer/*` aliases instead of relative imports |
| **D** | No loose files at the `base/widgets/` root — category folders only |
| **E** | Page code lives in `body/ items/ sheets/ hooks/ model/ shared/ __tests__/` |
| **F** | No `.tsx` over 300 lines (the Smart-UI guard) |
| **G** | A class extending `BaseEntity` is named `*Entity` in a `*-entity.ts` file |
| **H** | No absolute `lineHeight`; no bare `<TextInput multiline>` outside `AutoGrowTextInput` |
| **I** | Folder file counts — soft warning past 10, blocking past 15 |
| **J** | `PROJECT-MAP.md` still describes the tree (`npm run map` to refresh) |
| **K** | No unguarded `console.*` — it raises a LogBox in dev and leaks to logcat in release |
| **L** | No hand-rolled bottom sheets — they come from `base/widgets/sheets/` |
| **M** | Every `Modal` sets `statusBarTranslucent` (edge-to-edge Android jumps without it) |
| **N** | No background-audio capability in the Expo config (App Review rejected two builds) |
| **O** | Port interfaces are `*Interface`, never `I*` |
| **P** | A vocabulary is defined once — no status literals, inline `Failure` messages or hand-written `typeof` |
| **Q** | The custom route context must admit every root `+file` expo-router reads from it |

A Husky pre-commit hook runs `lint-staged` → `tsc --noEmit` → `check:structure` on every commit.
The emergency bypass is `git commit --no-verify`, and the reason belongs in the commit message.

> [!IMPORTANT]
> **A bug fix ships the test that would have caught it.** Every behavioural fix lands with a
> regression test that fails without it, a mechanical guard where one is possible, and a one-line
> entry in [`docs/regressions.md`](docs/regressions.md) recording the *class* of mistake — not the
> incident. That file is why this table keeps growing.

---

## Testing

```bash
npx jest                          # everything
npx jest src/domain               # one layer
npx jest --watch                  # while developing
npx jest path/to/file.test.ts     # one file
```

Tests live in `__tests__/` next to what they cover. Every use case, repository, mapper, store, value
object and entity is expected to have one; component tests use the shared harness in
`presentation/base/test-support/`, which renders inside the theme and safe-area providers.

Some invariants are asserted as tests rather than left to review — `theme/tokens/__tests__/scale.test.ts`
fails if a design-token ladder stops ascending, so a token added in the wrong place is caught
immediately rather than at the next redesign.

---

## Observability

Crash reporting is installed at the **entry point**, before the app starts — `index.js` calls
`installCrashHandlers()` and only then hands off to `expo-router/entry`. Three layers, because no
one of them sees everything:

| Layer | Catches | Where |
|-------|---------|-------|
| **JS catch-all** | Uncaught errors and unhandled promise rejections | `@react-native-firebase/crashlytics` installs an `ErrorUtils` handler inside its module constructor — the entry point forces that construction so it is not late |
| **Native handlers** | Signals, ANRs, NDK crashes | Crashlytics SDK, automatic. Android mapping via the Gradle plugin; iOS dSYMs via [`plugins/withIosCrashlyticsDsym.js`](plugins/withIosCrashlyticsDsym.js) |
| **`CrashSentinel`** | Deaths that run **no code at all** — OOM, an ANR resolved by a kill, `SIGKILL` | A foreground marker erased on `background`; still present at the next launch ⇒ the last session vanished. Reported with the breadcrumb it died on |
| **`AppErrorBoundary`** | Render-time throws | Shows the user a screen instead of taking the app down, and reports through the same sink |

Two rules keep the reports readable: `FailureReporter.report` only escalates the *unforeseen* codes
to Crashlytics (a validation message the product already answers is counted as an analytics event
instead), and breadcrumbs are **places in the code, never values** — an id or URL on a crash report
is user data leaving the device.

---

## CI/CD

[`.github/workflows/ci.yml`](.github/workflows/ci.yml), on every push:

| Job | Runs on | Does |
|-----|---------|------|
| `lint-and-typecheck` | every branch | ESLint + `tsc --noEmit` |
| `test` | every branch | Jest |
| `build-web-dev` | `dev` | Builds and deploys dev.recipely.net |
| `build-web-prod` | `main` | Builds and deploys recipely.net |
| `tag-release` | `main` | Computes and pushes the next version tag |
| `distribute-dev` / `distribute-ios-dev` | `dev`, **opt-in** | Gradle APK / IPA to Firebase App Distribution |
| `distribute-prod` / `distribute-ios-prod` | `main` | Play internal track + TestFlight |

> [!CAUTION]
> **Merging to `dev` does not ship a mobile build.** Lint, tests and the dev web deploy always run;
> the Android and iOS builds run only when explicitly requested — either by putting `[dist]`,
> `[dist:android]` or `[dist:ios]` in the **subject line** of the merge commit, or with
> `gh workflow run ci.yml --ref dev -f android=true`. The `ios` input defaults to **false**.
> `IOS_CI_ENABLED` is the iOS kill switch.
>
> Only the subject line is scanned. It used to be the whole message, and a commit whose body merely
> *explained* the markers shipped an IPA nobody wanted.

Branch flow: feature branch → PR → `dev` → (release PR) → `main`. `main` is release-only.

---

## Conventions cheat-sheet

Full rules live in [`CLAUDE.md`](CLAUDE.md) and [`architecture.md`](architecture.md); this is the
short version.

<table>
<tr><td valign="top" width="50%">

**Files & folders**

- One declaration per file; the file name is the kebab-case of what it declares.
- A folder is a unit of meaning: ≤10 files is fine, 11–15 warns, >15 is blocking.
- Group by what files are **for**, never by what they **are** — `model/taxonomy/`, not `model/types/`.
- A widget used by one page lives in that page's folder, not in `base/widgets/`.

**Code**

- Classes for use cases, repositories and entities; plain functions for stateless transformers.
- `Result<T, Failure>` instead of thrown exceptions.
- Every user-visible string goes through `t()`, with EN and TR kept in sync.
- Platform differences use `*.web.ts` / `*.ts` extension resolution, with shared types in one file.

</td><td valign="top" width="50%">

**Values**

- No magic numbers, hex codes or bare string keys — that includes `fontWeight: '600'`. Structural
  literals (`''`, `0`) live in `@core/constants`; every design measurement lives in
  `@presentation/base/theme`; API limits and storage keys live in `src/infrastructure/constants/`.
- A value only one page reads belongs in that page's `model/` — the test is reuse, not type.

**Responsive UI**

- `minHeight`, never `height`, on anything containing text.
- Never write an absolute `lineHeight`; derive it with `useTextLineHeight` / `lineHeightFor`.
- Prefer `aspectRatio` to a pinned image height.
- Multi-line fields use `AutoGrowTextInput`, never a bare `multiline` `TextInput`.

**Accessibility**

- Every `Pressable` carries `accessibilityRole`, and an `accessibilityLabel` when the visible label
  is not plain text.
- Theme palettes are contrast-checked. `maxFontSizeMultiplier` is a last resort.

</td></tr>
</table>

---

## License

Released under the **[GNU AGPL-3.0](LICENSE)**. You may read, run, modify,
self-host and redistribute this code, provided your version is released under
the same licence and its source is available to anyone who uses it — including
over a network.

A copyright licence covers code and nothing else, so the name **Recipely**, the
logo and the store listings are reserved separately in
[`TRADEMARKS.md`](TRADEMARKS.md): a fork is welcome, a look-alike in the stores
under the same name is not.

Note that this repository is the client. The backend it talks to is a separate,
private repository, and no API key, encryption key or service credential is
committed here — so this tree is something to learn from and build on rather
than a deployable copy of the product.

## Documentation map

| Document | What it is for |
|----------|----------------|
| [`PROJECT-MAP.md`](PROJECT-MAP.md) | Generated index of the tree — where every kind of thing lives. **Start here** when looking for something |
| `README.md` | This file — what the project is, how to run it, how it is shaped |
| [`architecture.md`](architecture.md) | Full architecture: layers, DDD guardrails, every coding standard with its rationale |
| [`CLAUDE.md`](CLAUDE.md) | The mandatory rule list, agent workflow and git flow |
| [`WORKFLOW.md`](WORKFLOW.md) | Step-by-step contribution workflow |
| [`docs/regressions.md`](docs/regressions.md) | One line per bug *class*: symptom, root cause, what now prevents a recurrence |
| [`docs/security.md`](docs/security.md) | Threat model, the request envelope, and what the shipped secrets do and do not protect |
| [`fastlane/README.md`](fastlane/README.md) | Store listing copy and assets for both stores, and how they get uploaded |
| [`fastlane/store-hub/`](fastlane/store-hub/) | The page that *generates* those assets — screenshot set, icon, feature graphic, metadata copy |
| [`docs/roadmap.md`](docs/roadmap.md) | Planned features — the reasoning behind each, and what is still open |
| [`docs/qa/android.md`](docs/qa/android.md) · [`docs/qa/ios.md`](docs/qa/ios.md) | Step-by-step manual QA passes, per platform |
| [`TODO.md`](TODO.md) | Closed-out record of the backend-contract parity work |
| [`LICENSE`](LICENSE) | AGPL-3.0 — the terms the code is offered under |
| [`TRADEMARKS.md`](TRADEMARKS.md) | What the licence does **not** cover: the name, the logo, the store listings |

---

<div align="center">

**AGPL-3.0** · Built with [Expo](https://expo.dev) · Designed in [Claude Design](https://claude.ai/design)

</div>
