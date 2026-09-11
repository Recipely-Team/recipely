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
| 2 | Headless path | ✅ **done**: envelope parity, backend route, credential sync, and the native call that spends the token (D24). On-device timing still unmeasured | [#423](https://github.com/Recipely-Team/recipely/pull/423) |
| 3 | iOS App Intents | 🟢 shipped: 11 intents, entity, 10 phrases x 14 languages. Control Center + Spotlight blocked (D20) | [#423](https://github.com/Recipely-Team/recipely/pull/423) |
| 4 | Android shortcuts + AppFunctions | 🟢 shipped: shortcuts, tile, widget, R8 clean. AppFunctions backed out (D22) | [#423](https://github.com/Recipely-Team/recipely/pull/423) |
| 5 | Gates and docs | ✅ **done**: rules W, X, AD, AE; CI asserts the kit in both generated projects and runs both parity suites; regression classes recorded | [#423](https://github.com/Recipely-Team/recipely/pull/423) |

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
- [ ] On device: does Siri actually invoke it by VOICE, in TR and EN — the simulator cannot recognise speech; the same intents were run through Shortcuts there (D26)
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
- [x] Session credential sync (`publishCredentials`) — backend #314 is merged to dev, so this is wired: minted once per launch, withdrawn on sign-out, and a failed mint leaves the stored token alone
- [x] The native HTTP call that SPENDS the token — `RecipelyAssistantClient` + `RecipelyAssistantWire`; "Ask Recipely" answers in Siri when the reply only speaks, and comes forward when it names an action (D24)
- [x] The headless call measured end to end against dev-api with the UNMODIFIED Swift client (D25): 1.5–10.9 s, so the client budget is 15 s. Siri's own deadline still needs a device

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

### D26 — Run on the simulator: what works, what the system asks, and what it does not tell us
`scripts/ios-intent-probe/run.sh` drives the Shortcuts app with XCUITest (the
app's own project cannot keep a test target — prebuild erases it) against an
ad-hoc-signed simulator build with a real intent token in its App Group.

- **Siri itself cannot be exercised here.** `XCUIDevice.siriService` opens the
  Siri window on the iOS 26 simulator and never recognises the injected text.
  The Shortcuts tile runs the same intent through the same system prompt.
- **All ten App Shortcuts are registered** and listed under "Recipely (Dev)".
- **The headless answer works end to end**: tile → "What would you like to
  ask?" → typed question → the backend's answer in a Siri snippet, 8 s, the app
  never opening.
- **Coming forward works — after a system prompt.** `continueInForeground`
  shows *"You'll need to continue in the app." Cancel / Continue* even with
  `alwaysConfirm: false`; Continue brings the app to the foreground and Siri
  says our "Opening Recipely.". An intent with `openAppWhenRun` comes forward
  without asking and queues `navigate/myRecipes` correctly.
- **Cancel does not withdraw.** The request stayed queued after Cancel, and
  one queued by a process killed at the prompt stayed forever. The app now
  drops any request older than two minutes (`isStaleInvocation`); the domain
  doc had promised that for months and nothing did it.
- **Unresolved: the prompt stayed English on a Turkish simulator** — and so did
  the system's own Cancel / Done. Our process resolves the table to
  "Ne sormak istersin?" (logged), a fresh install under Turkish, a
  `CFBundleLocalizations` list and a `Localizable.strings` copy all changed
  nothing. The system, not our strings, picks English for this app here; whether
  a device does the same needs a device.
- **Backend latency is Gemini's.** dev-api took 1.5–39 s; its logs show Gemini
  answering `503 high demand` or timing out at 60 s before the Groq fallback. A
  Siri caller needs its own, shorter budget on the backend — the in-app typed
  mode deliberately waits 90 s — so that is a backend decision, recorded here.

### D25 — Measured against the real backend, and what Siri says back
**The headless path works end to end.** The unmodified `RecipelyAssistantStore`,
`RecipelyAssistantClient`, `RecipelyAssistantWire` and `Envelope` were compiled
into a macOS command-line driver (Info.plist embedded with `-sectcreate`, the App
Group as a plain defaults suite) and pointed at dev-api with a real intent token
from `POST /assistant/intent-token`. Turkish and English: a spoken answer comes
back as text, "search for lentil soup" as `search` + `lentil soup`, "open my
recipes" as `navigate` + `myRecipes`. Latency 1.5–10.9 s, the slowest being the
first call — so the 15 s budget holds, with little to spare.

**An answer that acts says nothing.** Every action reply arrived with EMPTY
text, so the come-forward path would have shown Siri a blank dialog on the most
common answer. It now says "Opening Recipely." in the device's language.

**Siri asked its follow-up in English on every phone.** The phrases were
localized in fourteen languages; `requestValueDialog: "What would you like to
ask?"` was a bare literal. What Siri says back now lives in `osIntentDialogs`,
the generator writes it into a `RecipelyIntents.strings` table (its own table,
so it cannot collide with anything in the app target), the plugin registers it
as a second variant group, and the same join applies: every
`table: "RecipelyIntents"` literal must match an English value, every entry must
be read. Artifact tests and the CI language check cover the new table.

### D24 — The headless answer: one protocol bug, one API that is iOS 26 only
**The plaintext is `{ data: … }`.** The first draft of the native client sealed
the bare body. The backend's `decrypt-body` rejects any plaintext without a
`data` key, and the JS client adds that wrapper in its request interceptor, far
from `aes-envelope.ts` — so envelope parity said nothing about it. The shapes now
live in `RecipelyAssistantWire.swift`, which the Swift parity harness compiles
and checks; removing the wrapper turns it red. Recorded as a class in
`docs/regressions.md`.

**`continueInForeground` is iOS 26.** The intent targets 17.2. Below 26 the only
way to come forward from a background `perform()` is `ForegroundContinuableIntent`
+ `requestToContinueInForeground`, which always asks the user; 26 can skip that
(`alwaysConfirm: false`). The conformance is deprecated in 26, which warns only
once the deployment target reaches 26.

**Queue first, withdraw on "no".** The app drains the queue when it turns
active, so a request written after coming forward would wait for the next
launch. It is written first and withdrawn if the user declines Siri's
confirmation — otherwise it would run on a launch nobody connected with it.

**An answer that names an action always comes forward.** Actions drive screens,
and the five `CONFIRMED_ACTIONS` answer with a sheet, so rule X's invariant
holds on this path too: nothing destructive runs headless. `confirm` and
`cancel` are refused at both OS boundaries (`isOsReachableAction`): they answer a
sheet the user can see, and neither a stateless Siri turn nor a deep link any app
can fire can see one. The JS side reads the
action before the id, because an answered `askRecipely` entry now carries one.

**The base URL is written per variant.** An intent has no JavaScript, so the
plugin applies `api-hosts.ts`'s three rules (override, `extra.variant`,
production) and writes `RecipelyAssistantApiBaseUrl`; the dev prebuild was
checked to carry `https://dev-api.recipely.net/api/v1`. A test holds the host
literals and the Info.plist key names to `api-hosts.ts` and the Swift store.

**Review round (same day).** A cold "Ask Recipely" launches the app in the
BACKGROUND and React Native mounts; the queue was drained on mount, so a request
ran before the user answered Siri's prompt and "no" had nothing to withdraw. The
mount drain now waits for `active`. On 26 `supportedModes` is declared rather
than derived from the deprecated conformance — and measured, not assumed: the
extracted metadata said `8` before and `9` after, where `background` is `1` and
`.foreground(.dynamic)` is `8`. Left to derive, iOS 26 would have listed no
background mode for the one intent whose point is to run without a screen. The client budget is 15 s — the
fallback only works if the client gives up before Siri does. A reply with
neither words nor an action is `nil`. The bridge now removes entries it drops.

**Still to see on a device:** Siri's own deadline for `perform()`; whether the
follow-up question is Turkish on a Turkish phone (D26 — English on the
simulator for reasons outside our strings); spoken invocation, which the
simulator cannot recognise. The last build: `BUILD SUCCEEDED`,
`RecipelyAskIntent` extracted with `openAppWhenRun: false` and
`systemProtocols: [ForegroundContinuable]`.

### D23 — The review found two dead features and a gate that could not see them
Neither was visible to `xcodebuild`, `aapt2` presence checks, or any of the four
gates. Both were found by EXECUTING rather than inspecting.

**`nil as Any` kills the process.** `UserDefaults` stores property lists, and
Swift bridges `Optional.none as Any` to `NSNull`, which is not one — so
`set(_:forKey:)` raises `NSInvalidArgumentException`. Two of the eleven intents
passed a nil, one of them "Ask Recipely", the first of the ten phrases.
Confirmed by compiling the two shapes and asking
`PropertyListSerialization.propertyList(_:isValidFor:)`: the old one answers
`false`. An absent value is now an absent KEY — and the TypeScript boundary had
to learn the same thing, because an omitted key reads back as `undefined`, not
`null`, and was being dropped as an unknown word.

**A scheme-less `android:data` matches nothing.** Every VIEW filter on the
launcher activity requires a scheme, so all four shortcuts appeared in the menu
and did nothing when tapped. `aapt2` proved they were present, which is not the
same as launchable. The scheme is variant-dependent, so the generator now emits
a token and the plugin substitutes it — and the template moved OUT of the
library's `res/`, because the resolved copy the plugin writes into the app would
otherwise collide with it at merge.

**And the gate could not have caught either.** Rules AD and AE import the
generator, let it rewrite its own files, and compare the result with itself —
they detect a file out of step with the generator, never a generator that is
wrong. Rule W, which does check meaning, only walked `.swift` and `.kt`. It now
reads the generated XML too and requires a scheme, which is what makes the
second failure impossible rather than merely fixed. *The class:* **a freshness
check is not a correctness check** — regenerating proves the file matches the
code that wrote it, and nothing more.

### D22 — AppFunctions: the published alpha is not the documented one
Attempted, measured, backed out. What is actually true today:

- The artifacts exist: `androidx.appfunctions:appfunctions-service:1.0.0-alpha09`
  and `appfunctions-compiler:1.0.0-alpha11`, on Google's Maven.
- The compiler is a **KSP** processor. KSP is pinned to the compiler it was
  built against, and this project is Kotlin **2.1.20**, so the matching plugin is
  `com.google.devtools.ksp:symbol-processing-gradle-plugin:2.1.20-2.0.1`.
- **The mechanism works.** A conditional `buildscript {}` — one of the few blocks
  Gradle permits before `plugins {}` — puts KSP on the classpath only when
  `-PrecipelyAppFunctions=true`, so a disabled feature costs no resolution on an
  ordinary build. Proven: the flag-off APK builds unchanged, and with the flag on
  KSP applies and the extra source set compiles.
- **The API does not match the documentation.** Google's guide shows a class
  extending `AppFunctionService` with `@AppFunction` from `androidx.appfunctions`.
  The alpha09 AAR publishes no `AppFunctionService` at all; the annotation is
  `androidx.appfunctions.service.AppFunction`, and the service side is
  `AppFunctionEntryPoint` / `AppFunctionConfiguration` /
  `PlatformAppFunctionService`. This is D18's warning arriving in person: *"the
  API surface is still being refined."*

**Backed out rather than guessed.** Writing against an API that contradicts its
own documentation, which cannot be tested end to end because Gemini will not call
it without an early-access invitation, is not something a test could have caught
and not something a reader could have trusted. The measurement above is the
deliverable; the implementation is a short job once the invitation arrives and
the shape settles.

**Update 2026-09-11 — the first blocker is gone, the second is absolute.**
`androidx.appfunctions:appfunctions:1.0.0-alpha11` (2026-08-26) now ships what
the guide shows — `AppFunctionService`, `@AppFunctionServiceEntryPoint`,
`@AppFunction` — built against Kotlin 2.1.20, the project's own. But the EAP form
is closed (*"currently at capacity"*), and without it nothing on a user's phone
calls an AppFunction: only agents holding `EXECUTE_APP_FUNCTIONS`, which today
means Gemini in private preview. Adding an alpha library and a KSP processor to
every Android build for a surface with no caller is the trade D22 already
declined. Implement when either the EAP reopens or Google ships the Gemini side
publicly; `adb shell cmd app_function` makes it testable on the API 37 emulator
the moment it is worth doing.

### D21 — Android calls Indonesian `in`, and a deep link needs the catalogue id
Two things the generator had to learn, both silent failures otherwise.

**`values-id` is not Indonesian.** The platform still uses ISO 639-1's 1988
code, so the folder must be `values-in`; a `values-id` folder is read as the
*region* Indonesia and every Indonesian label falls back to English with nothing
logged. Hebrew (`iw`) and Yiddish (`ji`) are the same story, and the mapping
table names all three so the next person finds the answer in the code rather
than in a bug report. Verified in the built APK: `(in) "Tanya Recipely"`.

**The first generated `shortcuts.xml` said `action=null`.** The open-ended entry
has no action, and rendering its absence as text produced a link asking the
registry to run a word called "null". The link now carries the catalogue `id`
first and the action only when there is one — which also makes it the same three
fields an iOS App Intent writes into the queue, so both roads feed one `perform`
instead of two code paths. Rule W checks that shape now, and refuses a link with
no id at all.

### D20 — Spotlight indexing has nowhere in an Expo app to be triggered from
`IndexedEntity` (iOS 18+) would let Spotlight find a recipe by meaning rather
than by prefix, and the conformance itself is four lines. What it needs is a
call to `CSSearchableIndex.indexAppEntities` whenever the catalogue changes —
and there is no place in an Expo app to make it from.

The entity lives in the **app target**, because that is the only place Apple's
metadata extraction looks. The code that knows the catalogue changed lives in
the **pod**, which cannot see an app-target type. Swift has no `+load`, and
Expo's app-delegate subscribers are discovered through the generated modules
provider — pod-based, so an app-target class cannot register as one.

The three ways out, none free:
1. **Index lazily from `RecipeEntityQuery`**, which does run in the app's
   process. Cheap, but Spotlight finds nothing until the user has already used
   an intent once — which is the wrong way round for a discovery surface.
2. **A closure the pod holds and the app target fills**, needing an entry point
   that does not exist — the same problem, moved.
3. **Adopt `expo-app-intents`** (D18), which solves exactly this with Inline
   Modules: app-target Swift that Expo itself wires up.

Deferred rather than bodged. It is a genuine reason to revisit D18, and the
lazy version can land any time as a stopgap.

### D19 — `.xcstrings` needs a deployment target of 17; this app ships 15.1
The obvious format for the phrase catalogue is a String Catalogue, and it is
rejected outright: *"AppShortcuts.xcstrings is only supported for iOS 17.0 and
above. Use AppShortcuts.strings for previous versions."* The App Shortcuts
themselves are `@available(iOS 17.2, *)` and simply do not appear on anything
older — but the deployment target is a property of the whole TARGET, so the
catalogue format follows the oldest OS the **app** supports, not the oldest one
the **feature** does. Legacy `<lang>.lproj/AppShortcuts.strings` it is.

Three more things this cost, each found by building rather than by reading:

- **`knownRegions` was `(en, Base)`.** A localized resource only compiles for
  languages the project lists, so without widening it the other thirteen were
  generated, copied, compiled away, and Siri would have answered in English on
  every device with nothing failing. The plugin now reads the shipped languages
  from `i18n/locales/` rather than carrying a list of its own.
- **Fourteen files are ONE file to Xcode.** Registered individually they each
  install to `AppShortcuts.strings` in the bundle root and the last one copied
  wins; they belong in a `PBXVariantGroup` keyed by language.
- **`xcode`'s `addResourceFile` cannot be used at all.** It dereferences
  `pbxGroupByName('Resources').path`, and an Expo project has no such group —
  the same null-for-absent trap the group lookup sprang in Phase 0, one function
  along.

Verified in the built app: 14 `.lproj` folders, each carrying the ten phrases
under the exact keys the metadata processor extracted.

### D18 — `expo-app-intents` shipped 0.2.0 on 2026-09-10, and it is half of this

Published the day after Phase 0 measured all of this by hand. Its README states
D3 as its opening premise — *"App Intent types must be compiled into the iOS app
target. Apple's build-time metadata extraction does not see code in static
pods"* — and its documented limits restate D1: phrases are compiled at build
time and cannot be made from JavaScript, one non-array parameter per phrase,
**at most 10 App Shortcuts per app**, and every phrase must contain
`\(.applicationName)`. This app now declares exactly ten, all conforming.

**What it would replace:** the runtime pod half — the invocation queue, the
entity storage and the JS bridge, which is roughly `RecipelyAssistantStore` +
`RecipelyAssistantKitModule` + the TS surface. Its placement mechanism is Expo
Inline Modules (an `app-intents/` directory) rather than this repo's pbxproj
surgery, which is the more official of the two.

**What it would NOT replace:** every intent, entity and query. Those are yours
in both designs, and they are the bulk of Phase 3.

**Decision: not now, and the swap stays cheap.** Three reasons. It is iOS-only,
so Android keeps this module regardless and adopting it means maintaining two
stores instead of one — and the store here also carries the envelope key and
credentials that the Android half shares. It is one day old on the `next` tag.
And the TS surface here was deliberately named after theirs in Phase 1, so the
iOS half remains a contained swap whenever `latest` moves.

**Revisit when** `expo-app-intents` reaches the `latest` tag, or when this repo
next takes an Expo SDK upgrade — whichever comes first. The thing worth stealing
before then is Inline Modules as the placement mechanism, which would delete the
plugin's pbxproj code.

## Open questions for the user

- **A bare `zh` covers both Chinese scripts.** Apple's own resources are
  `zh_CN` / `zh_HK` / `zh_TW`, and modern apps ship `zh-Hans` / `zh-Hant`. iOS
  falls back from `zh-Hant` to `zh`, so the phrases DO resolve — a Traditional
  Chinese device just gets the Simplified wording. That is exactly what the app
  already does for its in-app copy, so the Siri phrases are consistent with it
  rather than worse. Splitting the script is an app-wide locale decision, not an
  assistant one.
- **~190 strings of build-only weight in the JS bundle.** `osIntentPhrases` and
  `osShortcutLabels` are read by the generators at build time and by no `t()`
  call, yet they ship in every locale. Moving them to a Node-only catalogue
  would take them out of the bundle and out of rule 11's scope; keeping them
  where they are keeps every translated string in one place for a translator.
  Worth a decision, not worth guessing at.

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

- [x] `RecipelySearchIntent` — `ShowInAppSearchResultsIntent`, the only single-turn path for free text (D1, D12)
- [x] `RecipelyAskIntent` — parameterless phrase + `requestValueDialog` (two turns, D1). Answers headless when it can, comes forward when the answer drives the app or there is no token (D24)
- [x] 9 singular intents (openRecipe, save, like, startTimer, readIngredients, readNextStep, generate, import, myRecipes)
- [x] `RecipeAppEntity` + `RecipeEntityQuery` (`EntityStringQuery`, diacritic- and case-folded with the current locale so "kofte" finds "Köfte")
- [x] `RecipelyRequest` — one enqueue helper, so eleven intents do not each spell the four keys
- [x] `AppShortcutsProvider` with 10 phrases (the maximum Apple allows, D18) — **English literals**
- [x] The five `CONFIRMED_ACTIONS` are absent from the catalogue entirely, so no phrase can reach one (rule X)
- [x] **Verified in a real build**: `BUILD SUCCEEDED`, 11 intents + 1 entity + 1 query extracted into `Metadata.appintents`, all `isDiscoverable: true`, 10 app shortcuts
- [x] Rule W widened to read the Swift named-argument form (`id:` / `action:`), proved by breaking it
- [x] Phrases for 14 languages, generated from i18n into `<lang>.lproj/AppShortcuts.strings` (D19)
- [ ] `IndexedEntity` for Spotlight semantic search — **blocked on an entry point, see D20**
- [ ] Control Center control — needs a widget extension target, which prebuild does not create today
- [ ] Onscreen entity annotation on recipe detail — needs `NSUserActivity` plumbed from the RN side
- [ ] Action Button — free once the intents exist; needs on-device confirmation only

## Phase 4 — Android

- [x] `recipely_shortcuts.xml` generated from the catalogue (4 static shortcuts) + labels in 14 languages, verified inside the APK with `aapt2` (D21)
- [x] The launcher meta-data sits on the **launcher activity**, not `<application>` — on the latter Android ignores it silently
- [x] Dynamic shortcuts (`pushDynamicShortcut`) — budget asked of `getMaxShortcutCountPerActivity` rather than guessed, minus the static four
- [x] Rule AE — the generated shortcuts must describe the catalogue that exists
- [x] 14 tests on the generated ARTIFACTS (`scripts/__tests__/generated-os-artifacts.test.js`), because a freshness rule compares a generator with itself — each of the three shipped bugs was re-introduced and caught
- [x] CI asserts every shipped language reached the generated project (rule 23c's precedent applied to localization)
- [x] Rule W widened to the link shape: `id=` mandatory, `action=` optional (proved by removing the id)
- [x] Quick Settings tile — declared in the **library** manifest so Gradle merges it (a service that ships with the code implementing it cannot fall out of step); verified in the APK
- [x] `startActivityAndCollapse(Intent)` throws on API 34+, so the `PendingIntent` branch is required rather than tidy
- [x] Widget — a button, not a data surface: `updatePeriodMillis` is 0 because there is nothing to refresh, and a widget that never refreshes cannot go stale
- [x] ~~`recipely://assistant/run` intent filter~~ — Expo already registers the variant scheme from `app.config.ts`; verified in the generated manifest
- [ ] AppFunctions service — **deferred on purpose, see D22.** alpha11 now matches the docs; what is missing is a caller — the EAP is at capacity and Gemini calls nothing without it.
- [x] `androidx.core:core-google-shortcuts:1.1.0` (so shortcuts reach Google's surfaces, D5) — on the classpath since Phase 1; pulls `play-services-appindex` + `tink-android`, R8 clean
- [x] ~~Apply to the Google AppFunctions EAP form~~ — checked 2026-09-11: the form is closed, *"The Early Access Program is currently at capacity."* There is nothing to apply to; Gemini stays out of reach until Google opens it
- [x] R8 keep rules — **not needed**, measured rather than assumed: `:app:minifyReleaseWithR8` is green and not one of its warnings names `assistantkit`. The tile and the widget are reached from the manifest, from which AGP generates keeps of its own.

## Phase 5 — Gates and docs

- [x] `check:structure` rule W — catalogue ↔ Swift/XML drift
- [x] `check:structure` rule **AD** — the Siri phrase catalogue is fresh (letters reassigned, D16)
- [x] `check:structure` rule **AE** — the Android shortcuts are fresh; "nothing destructive is headless" is rule **X**
- [x] CI: the generated `Info.plist` carries the App Group (matching the entitlement), the base URL and the envelope key; no background-audio mode (both iOS jobs, each proved red on a broken artifact)
- [x] CI: the generated `AndroidManifest.xml` references `@xml/recipely_shortcuts`, the XML exists, and no scheme token is left (both Android jobs)
- [x] CI: both envelope parity runners — `:recipely-assistant-kit:testDebugUnitTest` on the Android jobs and `scripts/verify-swift-envelope.sh` on the macOS ones
- [x] `docs/regressions.md` class rows
- [x] `npm run map`

---

## If the session ends

1. `git checkout feat/os-assistants-spike`
2. Find the first unchecked box in this file.
3. Read the Phase 0 findings — they take precedence **over** the plan text.
