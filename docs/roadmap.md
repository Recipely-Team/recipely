# Roadmap — planned features

Ideas that are decided-in-principle but not scheduled. This file holds the
**thinking**: what we want, why, what it depends on, and what is still open.

**This is not a task tracker.** When an item is ready to be worked, open a
GitHub issue for it and link the issue number back here — the issue carries the
assignment, the discussion and the PR link; this file carries the reasoning that
would otherwise be lost in a comment thread.

| Status | Meaning |
|---|---|
| `idea` | Agreed we want it; approach not settled |
| `shaped` | Approach settled, open questions answered, ready to issue |
| `blocked` | Waiting on something external |

---

## 1. Import a recipe from an Instagram **post**

**Status:** `partly shipped` — the caption path is live · **Extends:** the
existing Reel/video import

Video import already works (share sheet → backend → yt-dlp + transcription +
vision). Posts are a different problem: a carousel or single image with the
recipe written in the **caption**, and often the ingredient list burned into the
image itself.

- ~~Caption text is the cheap path — parse it before touching the images.~~
  **Shipped** — recipely-backend PR #239.
- Images need OCR, not transcription. Different pipeline, different cost.
- A carousel is N images; deciding which ones matter is part of the work.

**The open question, answered — and it was the wrong question.** The share
payload gives only a URL. It does not matter: the caption never had to come from
the share. `ReelMedia.probe()` already runs `yt-dlp --dump-json` before anything
is downloaded and already reads `description`, which for Instagram *is* the
caption. A small job, not a scraping problem.

**What it uncovered:** `/p/` links had always passed URL validation, so sharing a
photo post already queued a job — which reached the worker, spent its time, and
died at the download with a generic "couldn't fetch", while the recipe sat in a
caption that had been read two steps earlier. A failed download now falls back to
a caption-only extraction (and rescues a reel whose download fails for any other
reason too).

**Still open:** OCR for the ingredient list burned into the image, and choosing
which frames of a carousel are worth sending. Those are the expensive half; the
caption covers most food posts on its own.

## 2. Import a recipe from **YouTube**

**Status:** `idea` · **Extends:** the existing video import

Mostly the same backend pipeline as Instagram video, pointed at a different
source.

- Cooking videos on YouTube run far longer than a Reel. Transcription cost and
  wall-clock time both scale with length — the current 130s client timeout was
  sized for Reels and will need revisiting.
- Many channels put the full recipe in the description. Check that first; it is
  free compared to transcribing 20 minutes of audio.
- Chapter markers are a strong signal for step boundaries.

**Open:** do we cap video length, and what do we tell the user when we do?

## 3. Persistent Recipe & Timer view in Background

**Status:** `ready` — platform strategy & automatic trigger defined

The goal: keep the active recipe step, ingredients, and timer visible while the user navigates away or uses other apps during cooking.

**Trigger Logic:**
- **Automatic (No manual start):** Triggers automatically whenever the user pushes the app to the background (`AppState -> background`) while on the **Recipe Detail** screen.
- Auto-dismisses when the user finishes cooking or pops off the Recipe Detail screen.

**Unified Cross-Platform Strategy:**
To ensure strict feature parity, zero battery drain, and 100% App Store / Play Store compliance without heavy floating runtime permissions:

- **iOS** — **Live Activity & Dynamic Island** (`ActivityKit`). Shows current step, ingredients, and countdown timer on the Lock Screen and Dynamic Island. Includes interactive `Next` / `Prev` step controls.
- **Android** — **Ongoing Notification Card** (`Notifee` / Native Builder). Displays a persistent, lock-screen-ready notification card matching the iOS layout with action buttons for step navigation.

**Key Decision:** 
Avoided heavy floating system overlays (`SYSTEM_ALERT_WINDOW` / Video `PiP`) to maintain 1:1 cross-platform symmetry, full App Store Guideline compliance, and optimal battery efficiency.

## 4. Conversational AI recipe editing, with confirmation

**Status:** `shipped` · **Replaced:** the immediate-apply refine chat

Every message used to rewrite the recipe immediately. That was fast but
unforgiving — a vague instruction silently destroyed work, and there was no undo.

Shipped instead:

- The assistant **proposes** a change and shows what it would alter, as a diff
  against the current recipe.
- Nothing is applied until the user accepts. Declining leaves the recipe
  untouched.
- The conversation has memory, so "actually make it spicier too" builds on the
  previous turn instead of starting over.

**Why it mattered beyond convenience:** the accept/decline step gives an undo
boundary for free, and it turns a scary irreversible action into a safe one —
which is exactly what makes people willing to use AI editing at all.

**The open question, answered:** the backend returns a **whole recipe**, not a
structured patch, so the diff is computed on the client
(`model/refine/diff-editable-recipes.ts`). It compares lists line-wise rather
than positionally — a step inserted at the top would otherwise report every
following step as changed.

**What declining forced:** once a refinement is a proposal, an assistant summary
is no longer proof the recipe changed. The turn is marked `rejected`, and that
mark rides back to the refiner, which is told a rejected turn was never applied
— otherwise the replayed history describes a recipe that does not exist.
Backend: recipely-backend PR #237.

## 5. Advertising on web, Android and iOS

**Status:** `idea`

Monetisation across all three platforms, "with appropriate methods".

Practical constraints to design around rather than discover late:

- **Consent is mandatory before a single ad request.** iOS needs App Tracking
  Transparency for anything personalised; the EU needs a GDPR consent flow on
  web and mobile. Both must exist before launch, not after.
- **Different SDKs per platform.** AdMob covers Android and iOS; the web build
  is a separate integration. That is three surfaces to place, test and keep
  from breaking the layout — the responsive rules in `architecture.md` §5a
  apply to ad slots too.
- **Store policy.** Ads that cover content or interrupt a flow get apps
  rejected. Given this app was already rejected once under 5.1.1(v), a
  conservative placement is worth more than an aggressive one.

**A tension worth naming:** the README's own pitch is that recipes online are
"optimised for ad impressions, not for cooking" — scrolling past a life story to
reach the ingredients. Putting ads in the cooking flow would be selling the
exact thing we position against. That does not mean no ads; it means the
placement decision is a **product** decision, not an implementation detail.
Somewhere like the feed between cards, or the post-save screen, costs nothing
that the pitch promises. Mid-recipe or over the steps does.

**Open:** which surfaces are off-limits by policy? Deciding that first turns the
rest into ordinary integration work.

---

## 6. Voice assistant that drives the app (Gemini Live API)

**Status:** `shaped` — full plan in
[voice-assistant-plan.md](voice-assistant-plan.md) · **Extends:** the refine chat
in §4, which already established propose-then-confirm

A text **and** voice assistant that can do everything the app does — create,
publish, delete, save, like, search, write a profile bio — over Gemini's Live API
(WebSocket, free tier). Interruptible: the user can cut the model off mid-sentence.

What makes this different from a chatbot with an API attached: the assistant
**drives the UI where the user can see it**. "Create a recipe" opens the create
screen, the draft fills in, the user watches it happen. It is not dictation — the
AI decides what to write and issues the command; the user's words are never
transcribed into fields.

**What it depends on:** a new native dependency (`react-native-audio-api` — the
installed `expo-audio 55.0.16` neither streams mic PCM nor plays raw PCM), turning
the microphone permission on for the first time, and a backend PR that mints
ephemeral tokens so the API key never reaches the client.

**Why the design is shaped by token cost, not by features:** voice runs ~1.7k
tokens per minute, so the recipe text never enters the voice session. The model
issues `generateRecipe(prompt)`, the existing `/recipes/generate` pipeline writes
it server-side, and the model gets back a one-line summary. Tool declarations are
a single `runAction` with an action enum, because the Live API fixes the tool list
at session setup and this assistant navigates between screens mid-session.

**The open question:** the free tier's concurrent-session limit is not documented
anywhere — it has to be read off the AI Studio dashboard. Phase 0 is a throwaway
spike that measures real tokens per minute and confirms the model id is actually
callable before any UI is written.

## Adding to this file

Keep the shape: **what**, **why**, **what it depends on**, **what is still
open**. An entry that only says what would be a wish list. The open question is
usually the most valuable line — it is the thing that decides whether the item
is a day or a month.
