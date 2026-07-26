# Roadmap — planned features

Ideas that are decided-in-principle but not scheduled. This file holds the
**thinking**: what we want, why, what it depends on, and what is still open.

**This is not a task tracker.** When an item is ready to be worked, open a
GitHub issue for it and link the issue number back here — the issue carries the
assignment, the discussion and the PR link; this file carries the reasoning that
would otherwise be lost in a comment thread. `TODO.md` is unrelated: it is the
closed-out record of the backend-contract parity work, not a backlog.

| Status | Meaning |
|---|---|
| `idea` | Agreed we want it; approach not settled |
| `shaped` | Approach settled, open questions answered, ready to issue |
| `blocked` | Waiting on something external |

---

## 1. Import a recipe from an Instagram **post**

**Status:** `idea` · **Extends:** the existing Reel/video import

Video import already works (share sheet → backend → yt-dlp + transcription +
vision). Posts are a different problem: a carousel or single image with the
recipe written in the **caption**, and often the ingredient list burned into the
image itself.

- Caption text is the cheap path — parse it before touching the images.
- Images need OCR, not transcription. Different pipeline, different cost.
- A carousel is N images; deciding which ones matter is part of the work.

**Open:** does the share payload for a post give us the caption, or only a URL?
That single answer decides whether this is a small job or a scraping problem.

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

## 3. Float the app over other apps while cooking

**Status:** `blocked` — needs a platform decision

The goal is real: you are cooking, the recipe needs to stay visible while you
use something else. **But the two platforms cannot do the same thing**, so this
cannot be one feature.

- **Android** — genuinely possible. Either Picture-in-Picture (`PiP`) with a
  compact step + timer view, or a floating bubble via `SYSTEM_ALERT_WINDOW`
  (heavier: a runtime permission the user must grant in system settings).
- **iOS** — **not possible as described.** iOS has no floating-app-over-apps
  mode; PiP is reserved for video playback. The honest iOS equivalents are a
  **Live Activity / Dynamic Island** for the running timer and a **Lock Screen
  widget** — the timer and current step follow you, the whole app does not.

**Open:** accept the asymmetry (Android PiP + iOS Live Activity), or build only
the Live Activity shape on both so behaviour matches? Worth deciding before any
code, because the two answers share almost no implementation.

## 4. Conversational AI recipe editing, with confirmation

**Status:** `shaped` · **Replaces:** today's refine chat

Today every message rewrites the recipe immediately. That is fast but
unforgiving — a vague instruction silently destroys work, and there is no undo.

Wanted instead:

- The assistant **proposes** a change and shows what it would alter, as a diff
  against the current recipe.
- Nothing is applied until the user accepts. Reject leaves the recipe untouched.
- The conversation has memory, so "actually make it spicier too" builds on the
  previous turn instead of starting over.

**Why it matters beyond convenience:** an accept/reject step gives us an undo
boundary for free, and it turns a scary irreversible action into a safe one —
which is exactly what makes people willing to use AI editing at all.

**Open:** does the backend return a structured patch we can render as a diff, or
a whole recipe we have to diff ourselves? Front-end diffing works but is more
fragile with free-text steps.

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

## Adding to this file

Keep the shape: **what**, **why**, **what it depends on**, **what is still
open**. An entry that only says what would be a wish list. The open question is
usually the most valuable line — it is the thing that decides whether the item
is a day or a month.
