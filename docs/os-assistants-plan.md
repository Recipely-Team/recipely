# OS assistants — Siri (iOS) + shortcuts/Gemini (Android)

Opens the in-app voice assistant's **50-action** vocabulary to the phone's own
assistant. The plan lives at
`~/.claude/plans/i-erideki-sesli-asistan-yapt-k-warm-heron.md`; **this file is the
progress board** — when a session ends, work resumes from here.

## Status board

| Phase | Work | Status | PR |
|-------|------|--------|-----|
| 0 | Measurement and decision gate | ✅ **done** (except the on-device Siri trial) | — |
| 1 | Module skeleton + shared store | ✅ **done** | [#423](https://github.com/Recipely-Team/recipely/pull/423) |
| 2 | Headless path | 🟡 in progress — envelope parity done, backend route awaits approval | — |
| 3 | iOS App Intents | ⬜ not started | — |
| 4 | Android shortcuts + AppFunctions | ⬜ not started | — |
| 5 | Gates and docs | 🟡 rule W landed; the other two need free letters (D16) | — |

Branch: `feat/os-assistants-spike`

---

## Phase 0 — Measurement and decision gate

Purpose: decide by measurement whether Phase 2 is needed and where the Swift files
belong. **Not merged**; findings are written below.

- [x] `feat/os-assistants-spike` branch opened
- [x] `modules/recipely-assistant-kit/` skeleton (expo-module.config.json, package.json)
- [x] Shared TS types (four separate files) + the web no-op half
- [x] **Research round** — three assumptions turned out wrong, see below
- [x] TS native half + `index.ts`
- [x] iOS: Swift module classes (`RecipelyAssistantStore`, `RecipelyAssistantKitModule`) + proof intent (`RecipelySearchIntent`)
- [x] Android: Kotlin module class + store + `RecipelyShortcutPublisher` + `RecipelyAssistantConfig`
- [x] `plugins/withAssistantKit.js` + 10 tests
- [x] **Measurement 1a** — `prebuild --clean` passes on both platforms; Swift is copied into the app target and registered in the pbxproj, entitlement/Info.plist/manifest correct (D7, D8)
- [x] **Measurement 1b** — `pod install` + `xcodebuild` **BUILD SUCCEEDED**; the intent compiles in the app target and is **extracted into `Metadata.appintents`** (`isDiscoverable: true`) — D12, D13
- [ ] On device: does Siri actually invoke it, in TR and EN (**yours** — needs physical hardware)
- [x] ~~**Measurement 2**~~ — answered by research, no device needed (D2)
- [x] **Measurement 3** — `:recipely-assistant-kit:compileDebugKotlin` and the **full `:app:assembleDebug` green** (3m 7s); autolinking finds the module, manifest meta-data correct (D9)
- [x] Findings written into this file, decisions fixed

### Phase 0 findings

Following the voice-assistant plan's pattern: **this section overrides the plan
text.**

#### D1 — Siri does NOT accept a free-text parameter inside the phrase
The plan's headline was a single-turn phrase, `"Ask Recipely \(\.$question)"`. It
does not work: Siri app-shortcut phrases do not support freeform parameters, and
primitive values (String, Int) embedded in a phrase are not recognised — the
on-device language model expects a finite set of values. Only `AppEnum` /
`AppEntity` work inside a phrase.

**Two channels instead:**
1. **The `.system.searchInApp` schema** (`.system.search` on iOS 17, renamed on
   iOS 26) — Apple's own schema, and **Siri hands the searched string to the
   intent raw**. "Show me lentil soup in Recipely" works in one turn with free
   text. This is the only supported single-turn path for free text.
2. **`AskRecipely`** — no parameter in the phrase ("Ask Recipely"), then
   `$question.requestValue("What would you like to ask?")` makes Siri ask and
   captures the user's free-form answer. Two turns, but unlimited text.

#### D2 — With `openAppWhenRun = false` JavaScript does NOT run → Phase 2 is unconditional
The system launches the app in the background for the intent but creates no scene;
the React Native bridge never comes up, so neither a network call nor an action
dispatch is possible from JS. A headless answer **necessarily** means native HTTP
plus native AES-GCM. Phase 2 is no longer conditional, and Phase 0's second
measurement is moot.

#### D3 — App Intents Swift belongs in the **app target**, not the pod
Xcode's `AppIntentsMetadataProcessor` cannot reliably extract intent metadata out
of a static framework or SPM module; both modules have to conform to
`AppIntentsPackage`, and `useFrameworks: "static"` is the most fragile form of
that. Expo's own `expo-app-intents` reached the same conclusion: it keeps intent
declarations "in inline Swift modules so Apple's build-time metadata extraction
can find them". **Decision:** the source stays with the library and
`plugins/withAssistantKit.js` copies it into the app target and registers it in
the pbxproj. Measurement 1 is therefore a verification, not a fork.

#### D4 — `expo-app-intents` is iOS-only, and you still write the Swift
npm has only `0.1.0-canary` (the stable `0.0.1` is a placeholder), **no Android**,
iOS 16.4+. It generates no intents — you write the Swift; it supplies only the JS
delivery/queue layer. Our module **mirrors its API surface exactly**
(`useAppIntents`, `getPendingInvocationsAsync`, `removePendingInvocationAsync`,
`clearPendingInvocationsAsync`, `addAppIntentListener`,
`setEntityCatalogAsync(kind, entities)`, `refreshShortcutsAsync`) so the iOS half
can be swapped for it later. Android is entirely ours.

#### D5 — Android: minSdk **24**, targetSdk **36**
AppFunctions is `@RequiresApi(36)`, which reaches a very small slice of the user
base; it stays a strategic handle rather than today's surface. Dynamic shortcuts
need `androidx.core:core-google-shortcuts` on the classpath to reach Google's
surfaces (Assistant among them) — to be verified in Phase 4.

#### D13 — Metadata extraction WORKS; the approach is proven
Inside `RecipelyDev.app/Metadata.appintents/extract.actionsdata`:
`"RecipelySearchIntent"`, `isDiscoverable: true`, `openAppWhenRun: true`,
`systemProtocolMetadata: ["com.apple.link.systemProtocol.ShowInAppStringSearchResults"]`.
So the plugin's inject-into-the-app-target approach is **proven** — Siri, Spotlight
and Shortcuts will see the intent. (The *"Metadata extraction skipped. No
AppIntents.framework dependency found"* warning during the build belongs to the
**ShareExtension** target and is expected: it has no intents at all.)

Only the on-device check remains: does Siri actually match the phrase.

#### D12 — In this SDK the schema is NOT `searchInApp`, it is `ShowInAppSearchResultsIntent`
Xcode 26.6 / the iOS 26.5 SDK has no `searchInApp` member on
`AssistantSchemas.SystemIntent` — that name arrives with Xcode 27 (iOS 27), and the
research round described a later release at this point. The equivalent in this SDK
is **`ShowInAppSearchResultsIntent`** (iOS 17.2+): it takes
`criteria: StringSearchCriteria`, Siri puts the query into `criteria.term` **raw**,
and `openAppWhenRun` is `true` in the protocol itself. D1's conclusion is
unchanged; only the name is.

Also: `@available` must be **17.2** (not 17.0), and the import from the pod must be
written `internal import RecipelyAssistantKit` — Swift 6 rejects the implicit
access level of a module that is imported as internal elsewhere in the target.

#### D11 — The Xcode group must carry **no path**, or the path is written twice
The first real build failed with *"Build input file cannot be found:
`ios/RecipelyDev/RecipelyAssistant/RecipelyDev/RecipelyAssistant/RecipelySearchIntent.swift`"*.
A group that carries its own `path` is what its children resolve against, and our
file references are already project-relative, so Xcode joined the two. The group
is now **virtual** (`pbxCreateGroup(name)`, no path). Pinned by a test.

#### D9 — The Kotlin language version is BELOW 2.2
`ifEmpty { continue }` did not compile: *"break continue in inline lambdas is only
available since language version 2.2"*. The compiler ceiling is 2.2.0 but the
language version in use is older — no `continue` inside an inline lambda. None of
the four JS gates compiles Kotlin, so **only a real build** caught this; every
session that adds to the module should ask for an Android build (the rule at
regressions.md:1040).

Result: `:app:assembleDebug` **green**, the APK is produced,
`core-google-shortcuts` resolves, and no extra R8 keep rule was needed (debug;
release to be verified in Phase 4).

#### D10 — `check:structure`'s type/runtime rule had a false positive
The regex that exempts unions derived from `typeof <const>` ran with the `m` flag,
so `$` meant end of line: the body of an alias wrapped across two lines read as
empty and the exemption fell through. Because Prettier wraps at 100 characters,
long derived unions are the AVERAGE case, not the exception. The regex is pinned
with `\n` and `m` is gone; the fix was verified against a temporary file proving it
still catches a real violation.

#### D7 — Expo mods run in REVERSE order
`withMod` runs its own action and then calls the mod registered **before** it: the
**last** plugin in `app.json` runs **first**. Putting the local plugin at the end
of the list (the obvious place) ran `withAssistantKit`'s de-duplication before
everyone else, and the duplicate was appended afterwards. The plugin is now
registered immediately **before** `expo-share-intent` so that it runs **after** it.

#### D8 — The App Group already exists: `expo-share-intent` creates it
`group.net.recipely.app.dev` is already declared by the share extension — the same
container, for the same reason. The first prebuild wrote the group into the
entitlement **twice**, and a repeated entitlement fails validation at signing. The
plugin now de-duplicates the **whole list**, not just its own entry. Good news: the
group is already provisioned on Apple's side, so no new capability request.

Prebuild also caught two real bugs, both pinned by tests: `pbxGroupByName` returns
`null` for a group that does not exist (an `!== undefined` check took the wrong
branch, left `addSourceFile` without a group, and the `xcode` library died on a
null path), and the duplicate entitlement above.

#### D6 — ESLint applies rule 1 inside `modules/` too
`check:structure` only walks `src/<layer>`, but the
`recipely/one-declaration-per-file` ESLint rule is repo-wide. Rule 13's "shared
types in one file" applies here as "in one place, one file per type": four types,
four files.

---

## Phase 1 — Module skeleton + shared store

- [x] Shared store: iOS App Group `UserDefaults` (`RecipelyAssistantStore.swift`)
- [x] Shared store: Android `SharedPreferences` — no App Group, same process; nothing to widen
- [x] App Group identifier derived from the variant; `expo-share-intent` already provisioned it (D8)
- [x] Port: `src/domain/assistant/os/os-assistant-interface.ts`
- [x] Catalogue: `src/domain/assistant/os/os-intent-catalogue.ts` (11 entries) + 6 invariant tests
- [x] Impl + web no-op: `src/infrastructure/assistant/os/os-assistant-bridge{,.web}.ts`
- [x] DI token `OsAssistant` + infrastructure register + `ApplicationStores.osAssistant`
- [x] Deep link `recipely://assistant/run?action=&arg=` → `os-intent-link.ts` + `pending-os-intent.ts` + `+native-intent.tsx`
- [x] `use-os-assistant-invocations.ts`, mounted last in the pill (effect order = tier order)
- [x] Tests: catalogue invariants (6), deep-link parsing (11), bridge boundary (7), plugin (11)
- [x] `use-os-entity-catalogue-sync.ts` — writes recipes into the native catalogue + 6 tests (clears on sign-out)
- [ ] Session credential sync (`publishCredentials`) — waits on the Phase 2 token

## Phase 2 — Headless path *(unconditional per D2)*

The order was deliberately reversed: the backend PR needs **separate approval**
(plan line 204) while the envelope parity work needs nothing from it, so the
measurable half went first.

- [x] Backend PR: `POST /assistant/intent-token` (narrow scope, 30 days) — [recipely-backend#314](https://github.com/Recipely-Team/recipely-backend/pull/314), open against `dev` (D17)
- [x] Shared AES-GCM test-vector fixture (`__fixtures__/aes-gcm-vectors.json`, 5 vectors + 3 rejections)
- [x] Swift `Envelope.swift` (CryptoKit) + parity harness (not XCTest — D14)
- [x] Kotlin `Envelope.kt` (javax.crypto) + JUnit parity (4 tests green)
- [x] `EXPO_PUBLIC_API_AES_KEY` written into the artifact at prebuild (Info.plist + manifest), verified in the APK (D15)

### D14 — A parity test must be byte-exact, NOT a round trip
Three implementations (@noble/ciphers, CryptoKit, javax.crypto) run against one
fixture whose bytes come from **OpenSSL** — a fourth implementation, and none of
the three under test. The reason was measured by mutation: changing
`Charsets.UTF_8` to `UTF_16` failed **exactly one** of the four Kotlin tests, while
"opens what OpenSSL sealed" stayed green. The same mutation in Swift was caught
even on the ASCII vector, but again only by the seal test. **A round-trip test is
happy whenever the encryptor and the decryptor make the same mistake** — which is
why both native halves expose an `internal` seal that takes the nonce, and the
tests compare against the fixture's payload byte for byte. The nonce injection is
`internal` because a caller who can choose the nonce can repeat it.

Two Android traps surfaced here as well: in a JVM unit test **`android.util.Base64`
and `org.json` are android.jar stubs** that throw "not mocked" on first call. So
the half of `Envelope` that does the cipher touches no Android API (it takes and
returns `ByteArray`; base64 lives only at the `String` boundary) and the test uses
Gson + `java.util.Base64`. Otherwise the cipher could only be tested on a device,
which means after it ships. `android.util.Base64` stays in production code rather
than `java.util.Base64`: the latter is API 26+ and the module supports minSdk 24.

The Swift side is **not XCTest** because `expo prebuild` generates the Xcode
project: a test target added to it is erased by the next prebuild, silently,
leaving a suite that is present in git and never runs.
`scripts/verify-swift-envelope.sh` compiles `Envelope.swift` plus the harness with
`swiftc -O` and runs it; it **skips** where `swiftc` is absent, so the same command
is safe in a Linux CI job.

### D15 — `.env.local` leaks into prebuild; the absent case needs `EXPO_NO_DOTENV=1`
While verifying the no-key branch, `unset EXPO_PUBLIC_API_AES_KEY` changed
nothing: expo loads `.env.local` itself and a **different** key landed in
Info.plist. So what looks locally like a "keyless build" is a build made with
`.env.local`'s key. The real measurement used `EXPO_NO_DOTENV=1`, and both branches
were verified **in the artifact**: with a key it is written into Info.plist and the
manifest (seen in the APK's merged manifest via `aapt2`), and without one **the
value a previous prebuild left behind is removed** — tested by running over a
non-clean prebuild, which is the risky state.

With no key the plugin writes **no zero key**: `build-secrets.ts`'s 64-zero
fallback is right for JS (a cipher must always be constructible) but on the native
side a wrong key and a missing key look identical, and the symptom would be "every
request fails its auth tag while the code reports a network error". Absent means
"open the app", which is worse for the user and honest. A malformed key (63
characters, non-hex) **fails the prebuild**.

### D16 — Phase 5's gate letters X and Y are already taken
The plan reserved `rule X` for "generated artifacts are fresh" and `rule Y` for
"`CONFIRMED_ACTIONS` is never headless". Both letters are already in use by
unrelated rules in `scripts/check-structure.mjs`: **X** is "every page with a
scroller must be reachable by the assistant" and **Y** is "no unnamed numeric
literal in a style or a JSX prop". Rule **W** (catalogue ↔ native sources) is the
only one of the three that landed under the letter the plan gave it. The two
remaining gates take the next free letters after AC, so Phase 5 below names them
**AD** and **AE**. A rule letter is a join key like a screen name: reusing one
makes two different failures print the same label.

### D17 — A reject vector that only asks "did it throw" pins nothing
Review measured what this phase's own lesson (D14) had missed one level down. The
three implementations each refused the `iv-too-short` vector, and each for a
**different reason**: CryptoKit refuses an 11-byte nonce itself, `javax.crypto`
tolerates any GCM IV length and fails the tag instead, and the JS envelope wraps
everything into one error type. So deleting the explicit length check from any of
the three left every parity test green — measured in all three, independently.
Swift's `payload-shorter-than-tag` case was worse: it was "caught" only by a
SIGTRAP from `Data.prefix(-8)`.

Each rejection now **names** the refusal (`"failure": "badIvLength"`) and all
three assert that specific case, with an unknown name failing rather than being
skipped. Re-measured afterwards: removing the guard now fails in all three, each
naming what diverged.

The general form, one level above D14: **a test that asserts "something went
wrong" cannot see the difference between two implementations being wrong in
different ways** — which is the only thing a parity suite exists to see.

Two more from the same review, both measured: the hex key parsers disagreed
(Swift accepted `"+a"` ×32 because `UInt8(_:radix:)` allows a leading sign,
Kotlin accepted `"-1"` ×32 and stored `0xFF`, JS refused both), now all three
validate the alphabet and both native bad-key lists carry the signed forms. And
`withAssistantKit.test.js` cleared `EXPO_PUBLIC_API_AES_KEY` only in `afterEach`,
so its "built without a key" case passed only because CI's test job is the one job
without that variable — D15's trap biting the test instead of the build.

### Carried debt from this phase
- [ ] A `notBase64` reject vector. The three disagree today: Swift refuses an
  embedded newline, Android's decoder skips CR/LF, and JS throws a raw
  `InvalidCharacterError` from outside its `try`. Adding the vector fails until
  they are unified — which is the point, and is why it is a separate change.
- [ ] `Envelope.Failure` in Kotlin is a sealed class of singleton `object`s, so a
  thrown failure carries no stack of its own. Fine for a value-like refusal,
  worth revisiting if one ever needs context.
- [ ] The Kotlin parity suite runs only in the two Android CI jobs (the only place
  with that toolchain) and on demand via `npm run verify:envelope:android`. The
  Swift harness runs in `check:structure`, so it executes on every commit on a
  developer's machine and skips on Linux.

## Debt from review, carried into Phase 3/4

- [ ] Rule 5: `arg: 'next'` (repeats `StepCursor.Next`) and `arg: 'myRecipes'`
  (an `AssistantNavigationTargets` key, written for the third time). Domain cannot
  import presentation → the navigation-target vocabulary has to move to `@domain`
  or `@core/constants`.
- [ ] The `'recipe'` entity kind is spelled out in three languages (TS/Swift/Kotlin)
  — could be brought under rule W.
- [ ] `subscribe` is defined on both sides but no module calls `sendEvent`; the
  running-app path opens in Phase 3.

## Phase 3 — iOS App Intents

- [ ] `SearchRecipesIntent` — the `.system.searchInApp` schema (the only single-turn path for free text, D1)
- [ ] `AskRecipelyIntent` — parameterless phrase + `requestValue` (two turns, D1) → `/assistant/message`
- [ ] 9 singular intents (openRecipe, save, like, startTimer, readIngredients, readNextStep, generate, import, myRecipes)
- [ ] `RecipeAppEntity: AppEntity & IndexedEntity` + query
- [ ] `AppShortcutsProvider` + phrases for 14 languages generated from i18n
- [ ] The five `CONFIRMED_ACTIONS` are never headless; Siri asks via `requestConfirmation`
- [ ] Control Center control + Action Button
- [ ] Onscreen entity annotation on recipe detail

## Phase 4 — Android

- [ ] `shortcuts.xml` generated from the catalogue (static shortcuts)
- [ ] Dynamic shortcuts (`pushDynamicShortcut`) — recent/saved recipes
- [ ] Quick Settings tile
- [ ] Widget
- [ ] `recipely://assistant/run` intent filter
- [ ] AppFunctions service `@RequiresApi(36)`, behind a flag
- [ ] `androidx.core:core-google-shortcuts` (so shortcuts reach Google's surfaces, D5)
- [ ] Apply to the Google AppFunctions EAP form
- [ ] R8 keep rules (if needed)

## Phase 5 — Gates and docs

- [x] `check:structure` rule W — catalogue ↔ Swift/XML drift
- [ ] `check:structure` rule **AD** — generated artifacts are fresh (X is taken, D16)
- [ ] `check:structure` rule **AE** — `CONFIRMED_ACTIONS` is never headless (Y is taken, D16)
- [ ] CI: the generated `Info.plist` has the App Group and no new background mode
- [ ] CI: the generated `AndroidManifest.xml` references `shortcuts.xml`
- [ ] CI: both envelope parity runners — `:recipely-assistant-kit:testDebugUnitTest` on the Android job and `scripts/verify-swift-envelope.sh` on the macOS one
- [ ] `docs/regressions.md` class rows
- [ ] `npm run map`

---

## If the session ends

1. `git checkout feat/os-assistants-spike`
2. Find the first unchecked box in this file.
3. Read the Phase 0 findings — they take precedence **over** the plan text.
