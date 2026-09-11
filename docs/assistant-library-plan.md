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
| `assistant-react` *(phase 3)* | Headless bindings: `AssistantProvider`, `useAssistant()` (status, controls), `useAssistantLevels()` (input/output levels without re-renders), `useTranscript()`, `useAssistantAction()` | core |
| `assistant-widget` *(phase 3)* | Orb, mini bar, panel built ONLY on `assistant-react`'s public hooks; theme, strings and message slots from props | react |
| `assistant-token-server` *(phase 3)* | Mints Gemini ephemeral tokens with the integrator's system instruction, `ToolDefinition`s, voice and language baked in — where a Gemini session's configuration has to live (see phase 1 measurements) | core (types only) |

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

## Phase 3 — Headless React API, widget, action registry, token server, example app, docs → 0.1.0
## Phase 4 — Dogfood in a Recipely release → 1.0.0

## If the session ends
1. `git checkout feat/assistant-kit-core` (or the phase branch named above).
2. Find the first unchecked box.
3. The measured Gemini Live facts (token endpoint shape, binary frames, setup
   baked into the token) are in `docs/voice-assistant-plan.md` — they apply here
   unchanged.
