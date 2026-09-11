# Assistant library — the in-app voice assistant as a reusable package

Takes the Gemini Live voice assistant this app ships and turns it into packages
another app can drop in: a widget, a theme, a token and the actions it may run.
**This file is the progress board** — when a session ends, work resumes from the
first unchecked box.

## Decisions

| | |
|---|---|
| **v1** | React Native (iOS, Android, web), Gemini Live only |
| **v2** | More providers behind the same port — one OpenAI-Realtime-compatible adapter covers OpenAI, Azure, xAI and Inworld |
| **Later** | Flutter, sharing the token server and recorded-session conformance fixtures |
| **Names** | Working names `@live-assistant/*` (free on npm on 2026-09-11; the scope has to be claimed by the owner's npm account), `private: true`. The public name and licence are decided before the first publish |
| **App-agnostic** | The library is for ANY app. Nothing in `packages/` names Recipely, imports from the app, or carries its wire contract — Recipely's single `runAction` tool with an `action` word is mapped in the app's adapter. Tool calls are generic (`{ id, name, args }`), answered with `respondToTool(call, response)`. Enforced by `check:structure` rule AD (CLAUDE.md §27) |
| **Dogfooding** | Recipely is the first consumer. Every phase ends with the app on the package and its behaviour unchanged |
| **Boundary** | Packages define their own `Result` and failure CODES, and speak only in generic terms (tool name + raw args); the app maps codes to its own `Failure` kinds and copy. That mapping is what every integrator will write, so Recipely writes it first |
| **Headless first** | Usable with or without the widget. Everything the widget draws with — state, who is speaking, both audio levels, the transcript — is public API. The widget uses nothing a custom UI cannot |
| **Animation data never re-renders** | Levels change 30–60 times a second, so they arrive by subscription / Reanimated shared values, not React state. State that changes a few times a turn (status, transcript) is React state |
| **Customisable text** | Incoming and outgoing messages render through replaceable slots (`renderMessage`, per-role components) plus theme and strings; headless users get the raw transcript |
| **Branch policy** | Everything stays on its own branch (`feat/assistant-kit-*`) until the library is COMPLETE. No PR to `dev` or `main` before then; the branch is pushed only as a backup |

## Packages

| Package | Holds | Depends on |
|---|---|---|
| `assistant-core` | `Result`, failure codes, the session port and its events, `ToolCall` / `ToolDefinition`, PCM codec, (later) audio ports and the tool registry | nothing |
| `assistant-gemini` | Gemini Live adapter: socket, setup handshake, frame mapping, generic tool calls and cancellations | core |
| `assistant-audio` | `Microphone` and `PcmPlayer`, native (`react-native-audio-api`) and web (Web Audio) by platform extension, each with `level()` | core; peers `react-native`, `react-native-audio-api` |
| `assistant-react` | Headless bindings: `AssistantProvider`, `useAssistant()` (status, controls), `useAssistantLevels()` (input/output levels without re-renders), `useTranscript()`, `useAssistantAction()` | core |
| `assistant-widget` | Orb, mini bar, panel built ONLY on `assistant-react`'s public hooks; theme, strings and message slots from props | react |
| `assistant-token-server` | Mints Gemini ephemeral tokens with the integrator's system instruction, `ToolDefinition`s, voice and language baked in — where a Gemini session's configuration has to live (see phase 1 measurements) | core (types only) |

## Phase 1 — Workspace and the Gemini transport

- [x] npm workspaces (`packages/*`); tsc, jest, lint, check:structure and a web export all resolve a workspace package (the web bundle carried a probe string from the package)
- [x] `assistant-core`: `Result`, `AssistantFailureCode`, `Speaker`, `AssistantSession<Connection>` port with `audioFormat`, `SessionEvent`, `ToolCall`, `ToolDefinition`, PCM codec + resampler — grouped by capability (`result/`, `session/`, `tools/`, `audio/`)
- [x] `assistant-gemini`: `GeminiLiveSession` + protocol, frame mapper, setup request, DTOs — moved with their tests. `wsUrl` defaults to the constrained endpoint; `toolCallCancellation` is reported as `toolCallCancelled`
- [x] Made app-agnostic: `runAction`, the `action`/`arg` fields and every recipe fixture left the packages; rule AD keeps them out (mutation-checked: an app import, a relative import out of the package, and the word `runAction` each fail the gate)
- [x] Recipely adapter: `infrastructure/assistant/live/gemini-live-session.ts` maps codes → `Failure`, a generic call → the app's `{ action, arg }`, answers under `ApiLiveTool.name`, drops cancellations (as before); every other event passes through, checked structurally by tsc
- [x] **Measured against real Gemini Live from Node, outside the app (dev token):** ready in ~950 ms with the DEFAULT `wsUrl` (identical to the backend's); a spoken-style request produced a generic `toolCall { name: 'runAction', args: { action: 'navigate', arg: 'myRecipes' } }`, `respondToTool(call, …)` was accepted and the turn completed with transcript and 1.8 s of audio
- [x] Phase review (diff-scoped): APPROVED, no blocking findings. Follow-ups applied in phase 2's commit: rule AD also catches double quotes, `require`, `import()`, `jest.mock`, side-effect imports and the word "recipe", and scans native/README files (each bypass mutation-checked); Gemini's wire `role` is `LiveProtocol.userRole`, not `Speaker`; setup-frame docs scoped to tokens minted with a setup; the app adapter takes the port type, and its tests are type-checked against `SessionEvent`

**Measured, and why there is no client-side setup:** with an ephemeral token the session's configuration (instruction, tools, voice) is fixed at mint time and a client's setup frame is discarded — tools the token did not declare simply do not exist, with no error. So an integrator's configuration lives in the token server (phase 3), not in `connect`. Open question for phase 3: whether a token minted WITHOUT a baked setup honours a client's setup frame — measure before offering one.

## Phase 2 — Audio and levels

- [x] `assistant-core`: `AssistantMicrophone` / `AssistantPlayer` ports (both `LevelSource`), failure codes `microphone_denied`, `microphone_unavailable`, `player_unavailable`
- [x] Levels for drawing, never re-rendering: `LevelSource.level()` is PULLED on an animation clock. `LevelTimeline` lays ~20 ms slices on the player's `currentTime` where the previous chunk ends, so the "assistant is speaking" level follows what is HEARD, not what arrived (a reply arrives seconds ahead of playback); `flush` silences it at once. `toDisplayLevel` maps RMS on a decibel scale (speech ≈ 0.7, whisper ≈ 0.3); `smoothLevel` gives frame-rate-independent attack/release for an orb
- [x] `assistant-audio`: the app's native and web microphone and player moved in with their tests, speaking codes instead of app `Failure`s; level tests for native mic, native player and web player
- [x] Recipely adapters: `microphone.ts` / `pcm-player.ts` wrap the package (which picks the platform), `toAppFailure` maps every code to the kind and diagnostic the app always reported — one table, typed as a full record. The app's `.web` pair is gone: the package's pair replaces it
- [x] Gates green; the web export bundles the package's WEB files (`createScriptProcessor`, `getUserMedia` present, `createBufferQueueSource` absent)
- [ ] On a device: voice on iOS and Android still sounds and interrupts as before (JS moved unchanged; checked in phase 4's dogfood build)

## Phase 3 — Headless controller, React API, widget, token server, docs → 0.1.0

- [x] **3a — `AssistantController` (core, framework-agnostic).** The generic half of the app's 900-line session store: start order (access → `getConnection` → microphone → player → subscribe → connect), abandonment checks after every await, mute that withholds frames, the echo gate (only where `cancelsEcho` is false, following `player.remainingSeconds()` plus a tail), interruption flush, transcript assembly with an utterance gap, `thinking` and `no_answer`, serialised tool calls answered by a `ToolRegistry` (unknown names and throws answered too, withdrawn calls never run, answers for a replaced socket dropped), `goAway` resumption through `getConnection({ resumptionHandle })` with a handover limit, a silence timeout (opt-out with `null`), and `speaking` that lasts until the queued reply has PLAYED. State is an immutable snapshot with `subscribe`/`getState` (ready for `useSyncExternalStore`); levels are `inputLevel` / `outputLevel`, never state. Recipely-only concerns (budget heartbeat and warning, HTTP typed fallback, action chips' wording) stay in the app
- [x] 3a tests: 25 controller + registry + transcript tests with fakes; four behaviours mutation-checked (mute/echo gate, abandonment after connect, withdrawn calls, answers to a replaced socket). **Against real Gemini Live, three runs:** `connecting > listening > thinking > working > thinking > speaking > listening`, transcript = the user's line, a succeeded `runAction` entry, the assistant's reply; ~1.3 s audio; stop → `idle/stopped`. The first live run caught a real defect — a `listening` flash between the tool and the reply — fixed and pinned by a test
- [x] 3b — `@live-assistant/react` (peer `react`): `AssistantProvider` (the app builds and owns the controller), `useAssistant()` (state + controls), `useAssistantState(selector)` (re-renders only for its slice — measured: token-count updates cause zero renders of a status-only component), `useTranscript()`, `useAssistantLevels()` and `useLevelFrames(onFrame)` (both levels every animation frame, measured at ONE render for the component's lifetime), `useAssistantTool(tool)` (registered while mounted, latest handler, unregistered on unmount)
- [x] 3c — `@live-assistant/widget` (peers `react`, `react-native >= 0.76`): `AssistantWidget` (floating bottom-right/left or inline), `AssistantOrb` (a glow that follows the assistant's voice, a ring that follows the user's, a pulse while connecting/thinking/working; eased levels written into `Animated.Value`s — measured ≤ 1 commit over 500 ms of frames; Reduce Motion honoured), `AssistantPanel`, `AssistantTranscript` with `renderMessage(entry, fallback)` / `renderTool(entry, fallback)` slots, `StatusLine`, controls and a composer. Every colour/measure from `theme`, every word from `strings` (English defaults, one-level-deep overrides). Built only on `@live-assistant/react`'s public hooks. **Checked in a browser** with a scripted controller (a temporary, uncommitted route): idle orb, live panel, growing user line, tool chip, assistant glow, a Turkish/orange/avatar variant via `strings`/`theme`/`renderMessage`, typing and End — at phone and desktop widths. The first look caught a panel whose width jumped with the first words; it now takes a fixed width capped by the window
- [x] 3d — `@live-assistant/token-server` (Node ≥ 18, no dependencies beyond core's types): `mintGeminiLiveToken({ apiKey, model, systemInstruction, tools, voiceName, languageCode, resumptionHandle, … })` → `{ token, model, wsUrl, expiresAt }` or a coded `TokenFailure` (never throws). Same measured body as Recipely's backend minter (single use, 30 min session, 60 s start window, audio + both transcriptions, sliding window, resumption always on); `ToolDefinition` JSON Schema is normalised to the upper-case type names the Live API is measured to accept. 8 unit tests with an injected `fetch`
- [ ] 3d live check — **needs the owner's Gemini key**: mint with the package, run the controller, see a generic `startTimer({ minutes: 5 })` arrive; and answer the open question (does a token minted WITHOUT a setup honour a client's setup frame?). The check is committed as `packages/assistant-token-server/scripts/live-check.ts` (`read -s GEMINI_API_KEY && export GEMINI_API_KEY; npx tsx packages/assistant-token-server/scripts/live-check.ts`); reading the dev box's key was refused by the auto-mode classifier as credential exploration, so the owner runs it with their own key
- [x] 3e — `packages/README.md` (overview, architecture diagram, server + app quick start, widget customisation, headless usage, built-in behaviours, error codes, notes) and a README per package; every package at 0.1.0 (still `private: true` — publishing waits on the name, the npm scope and the licence, the owner's decisions)
- [x] Phase 3 review (diff-scoped): REQUEST CHANGES, five blocking findings, all fixed with regression tests that fail without the fix (mutation-checked):
  - a socket refused before `setupComplete` emitted `Closed` during `connect` and `start()` reported success → `Closed` is ignored while a socket is connecting, `connect`'s own failure is returned
  - stop-then-start let the abandoned start close the devices the new session owned → one ending at a time: `idle` is published at once, the abandoned start releases what it opened, and a new `start()` waits for the ending
  - `LevelTimeline` grew for the whole session when nobody read levels (also in the app) → pruned on push; an hour of frames stays under 400 slices
  - a standalone `AssistantOrb` did nothing on press, and composer/controls/theme hooks were not exported → the orb toggles the session by default; everything the widget composes is exported
  - `useLevelFrames` requested a frame 60×/s for the app's lifetime → `enabled` flag; the orb pauses while idle or with Reduce Motion
  - also fixed: the answer wait restarts from the user's LAST pause and only model output ends it; `speaking` settles after tools that outlived the turn; tool calls stay one at a time across a handover; the web microphone replaces `onFrame` on restart; composer/controls/transcript no longer re-render per fragment; screen readers hear final messages, not fragments; a `style` prop for safe-area insets; the token server never throws on an aborted body read and maps `type: [x, 'null']` to `nullable`; checked again in a browser
## Phase 4 — Recipely runs on the library → 1.0.0

The app's `assistant-session-store` keeps its public shape (so the UI and the
behaviour its 77 tests pin stay as they are) and delegates the session to an
`AssistantController`. Only Recipely's own concerns stay in the store.

- [x] Library additions the dogfood needs (each generic): `sendText(text, { hidden: true })` for a nudge the model should act on but the transcript should not show (Recipely's budget warning)
- [x] DI hands the store the LIBRARY objects (`GeminiLiveSession`, `Microphone`, `PcmPlayer`); the app's session/mic/player adapters and their domain ports go, `toAppFailure` stays
- [x] Store on the controller: `getConnection` = `tokens.mintSession(locale, handle)` (a Denied grant throws a typed refusal that comes back as `cause` → `Unavailable` + `deniedReason`); a `ToolRegistry` with the one `runAction` tool → `registry.run(action, arg)`; transcript synced by entry id (tool entries → action chips as today) plus the app's own lines (typed HTTP turns, the Stop chip on a silence end); status = controller status with the app's `Unavailable` overlay; heartbeat + budget warning while live; `level` published on an interval from `inputLevel`/`outputLevel` until the UI moves to `useLevelFrames`
- [x] The 77 store tests move to library-shaped fakes (all pass with assertions unchanged; only the harness and a microtask-settle helper changed) with their assertions unchanged wherever the behaviour is unchanged; any intended difference (speaking lasts until playback ends) is listed here
- [x] Gates green (2579 tests). **Checked live in the real app** (web, localhost:8081 → a local CORS proxy → dev backend → Gemini): the owner talked to it by voice — greeting, "profil sayfasına git" (navigate chip + page change), "temayı Kraliyet Moru yap" (setPreference chip + theme change) all worked through the library
- [ ] **Resume here (2026-09-11, stopped for the usage limit):**
  - [x] Behaviour-equivalence audit (code-reviewer, old store vs new): **SAFE TO TEST ON DEV — no blocking regression.** Every behaviour of the old 900-line store has a named home in the new stack; the public store state and actions are byte-identical since 7b254624, so no screen changes. Better than before: the budget heartbeat survives a handover (the old epoch guard discarded every report after the first `goAway`, so the number froze and a metered account could not be cut off), a typed turn while connecting can no longer overwrite a live session's status, the echo gate follows the real playhead, and a socket the server refuses now reports why. Its four non-blocking notes are fixed: the no-answer notice clears as soon as the user speaks again; `start()` says "connecting" while it waits for the last session to hand its devices back; a tool call dropped unrun on a handover is documented; and the level is no longer published for a session that has ended. New tests: the budget still ends a session at zero AFTER a handover, the notice clearing, and the connecting-while-waiting status
  - [x] FIXED (both PRE-EXISTING, not from the migration — the registry and the handlers were untouched, so dev and prod have them too): `search` returned before the rows arrived, so the model was told `recipes=none` and said "bulamadım" over a list that had just filled in; and `openRecipe` matched only the rows the feed happened to hold, so the model fell back on a recipe id it remembered and opened the wrong one. `search` now waits for `Loaded.query` (4 s bound) and `openRecipe` searches for a name the screen does not show before giving up. Regression tests fail without each fix; two rows in `docs/regressions.md`
  - [x] The three live failures are fixed and on their way to dev on their own branch (PR #429, `fix/assistant-screen-timing`): search waits for its rows, openRecipe searches for a name the screen does not show (but never for a position), reads wait for a screen that is still arriving. Review found one real defect in the fix itself — a positional argument fell into the name search — fixed with tests
  - [ ] Follow-ups the review named, not in that PR: a read on a screen that has not MOUNTED yet still answers `unavailable_here` (`waitForScreenHandler` for reads); a genuinely empty draft waits 3 s before saying so; the assistant's timing constants (4 s, 3 s, 500 ms, 4 s) live in four files and no one place shows what a single tool call may cost
  - [ ] Old note, now covered by the above: reading a recipe's steps out loud ("yapılışını okuyamadı") — measure with a temporary `__DEV__` log of `{args, result}` in `assistant-live-tool.ts`
  - Local web against a remote backend needs: `APP_VARIANT=development`, `EXPO_PUBLIC_API_BASE_URL=http://localhost:3001` (a local proxy adding CORS for localhost:8081, since dev/prod run NODE_ENV=production and refuse localhost), the dev envelope key in `EXPO_PUBLIC_API_AES_KEY`, port 8081
- [ ] On-device voice check on iOS and Android (owner)
- [ ] Owner decisions pending: login token 7d → 30d (chosen: 30d; backend `JWT_EXPIRES_IN`, dev first, prod on approval); logged-out header shows initials instead of the default avatar (fix on its own `fix/` branch from dev, not this one)
- [ ] Merge to `dev` — the owner allowed dev FOR TESTING once the equivalence audit confirms same-or-better behaviour; release → 1.0.0


## If the session ends
1. `git checkout feat/assistant-kit-core` (or the phase branch named above).
2. Find the first unchecked box.
3. The measured Gemini Live facts (token endpoint shape, binary frames, setup
   baked into the token) are in `docs/voice-assistant-plan.md` — they apply here
   unchanged.
