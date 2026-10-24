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
| `shipped` / `partly shipped` | Live; the entry keeps only what is still open |

---

## 1. Import a recipe from an Instagram **post**

**Status:** `partly shipped` — the caption path is live (recipely-backend #239)

The caption comes from the `yt-dlp --dump-json` probe that already runs before any
download, and a failed download falls back to a caption-only extraction (which also
rescues a reel whose download fails for any other reason).

**Still open:** OCR for the ingredient list burned into the image, and choosing
which frames of a carousel are worth sending. Those are the expensive half; the
caption covers most food posts on its own.

## 2. Import a recipe from **YouTube**

**Status:** `shipped` — YouTube and Facebook in #475 (YouTube links go through the YouTube
Data API importer, not yt-dlp); TikTok links are imported too.

**Open:** do we cap video length, and what do we tell the user when we do? Many
channels put the full recipe in the description; check that before transcribing.

**Pinterest:** `built, PR open` — app #602, backend #415. A pin (`pinterest.*/pin/<id>`,
`pin.it/<code>`) gets its own label, seal and importing look; a video or idea pin imports the
recipe in the pin, and any other pin follows its link to the recipe site.

## 2a. Import review and suggested recipes

**Status:** `built, PR open` — app #607, backend #418

An imported draft shows **what we read** (caption, transcript, page) and marks the lines the
model **guessed** rather than read, so the user checks those before saving. When a post names a
dish but has no recipe in it, the import offers a **suggested recipe** for that dish, labelled
as a suggestion, instead of failing with "no recipe found".

**Open:** not yet seen on a live import — check one reel without a recipe on dev after the
backend deploys.

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

**Status:** `shipped` (recipely-backend #237)

The assistant **proposes** a change as a diff against the current recipe; nothing is
applied until the user accepts. The backend returns a whole recipe, so the diff is
computed on the client (`model/refine/diff-editable-recipes.ts`), line-wise rather than
positionally. A declined turn is marked `rejected` and the refiner is told it was never
applied — otherwise the replayed history describes a recipe that does not exist.

## 5. Advertising on web, Android and iOS

**Status:** `shipped` — AdMob with UMP consent and App Tracking Transparency on mobile
(#558), one AdSense unit on the web feed. Placement rules are CLAUDE.md rule 23e.

**The product decision that stays:** the pitch is that recipes online are "optimised
for ad impressions, not for cooking". Ads go between feed cards, never in the cooking
flow or over the steps.


## 6. Voice assistant that drives the app (Gemini Live API)

**Status:** `shipped` — the library is
[Recipely-Team/live-assistant](https://github.com/Recipely-Team/live-assistant); one gap left on
Android: [android-echo-cancellation.md](android-echo-cancellation.md)

The assistant drives the UI where the user can see it — "create a recipe" opens the
create screen and the draft fills in. The recipe text never enters the voice session
(voice costs ~1.7k tokens/min): the model calls `/recipes/generate` through a single
`runAction` tool and gets back a one-line summary.

## 7. Diary: log a meal by describing it or photographing it

**Status:** `idea` · **Extends:** the Food Diary's Quick add (PR #494)

Quick add today asks for a name and numbers. Most people know what they ate,
not its calories. The user writes "a plate of menemen and two slices of bread"
or sends a photo of the plate, and an AI returns a short **list of candidate
foods with portions and estimated calories/macros**. The user ticks what is
right, adjusts servings, and logs it.

- Text is cheap: one model call returning structured candidates.
- A photo needs a vision model and a per-user budget (same cost concerns as
  the import pipeline's vision step).
- The candidates are estimates, so the UI must say so and let every number be
  edited before it is saved.

**Open:** do we estimate from a nutrition database (accurate, needs a source)
or from the model alone (fast, drifts)? Does the photo go through the backend
(key stays server-side), and what is the daily cap?

## 8. Diary: height, weight and computed daily goals

**Status:** `idea` · **Extends:** Daily goals

Goals are typed by hand today. With **height, weight, age, sex, activity level
and aim** (lose / keep / gain) the app can propose goals (e.g. Mifflin-St Jeor
for energy, protein per kg of body weight). Every field is **optional**: the
calculation uses what it has and falls back to the defaults for the rest.

- These are health data: stored per user, removed with the account (like the
  diary rows), never shown publicly.
- The proposal is a suggestion the user accepts or edits, never a silent
  overwrite of goals they set themselves.
- The voice assistant can already compute goals from what the user tells it;
  stored body data lets it do so without asking every time.

**Open:** where the fields live (profile vs diary goals sheet), and whether a
weight log over time is wanted (it turns a setting into a chart).

## 9. Comment-to-DM recipe delivery for creators

**Status:** `built, awaiting Meta App Review` — board: [docs/comment-to-dm-plan.md](comment-to-dm-plan.md)

Food creators pay ~$100/month for ManyChat-style tools that DM a link when a follower
comments a keyword. Recipely sends the **recipe itself**. Backend #374 and app #503 are
on dev; Advanced Access needs Meta App Review and Business Verification.

## 10. Creator storefront

**Status:** `partly shipped` — creator pages (`/creators`, `/creators/<userId>`),
Instagram/TikTok creator tags and follow shipped in #496. `built, PR open`: the page address
is the creator's approved Instagram handle (`/creators/<handle>`; old id links keep working)
and followers get a "New recipe from {creator}" notification in their own language — app
#603 and #606, backend #420.

**Still open:** a creator without an Instagram handle keeps the id address; decide whether
a TikTok handle may stand in.

## 11. Recipely Kitchen: curated, copyright-free recipes

**Status:** `building` — contract in [recipely-kitchen-contract.md](recipely-kitchen-contract.md);
the first 33 recipes are in the backend's `data/curated-recipes/`.

Recipes Recipely publishes itself under the official account, with original steps, USDA
nutrition and freely licensed, credited photos.

**Blocked:** copying the 33 to production — the import needs the production database, so
the owner runs it on the prod box (dry-run first).

## 12. Creator stats

**Status:** v1 `shipped` to dev (#562, backend #390) · v2/v3 `idea` — plan in [creator-stats-plan.md](creator-stats-plan.md)

A stats panel for creators who run comment-to-DM automations: v1 shows the
funnel only Recipely can see (comment → DM → recipe opened → saved) and a
follower trend from our own snapshots, with no new Instagram permission.

**Later (v2):** audience by country, city, age and gender compared between two
dates, and the engaged audience for the last 7 / 30 days — both need
`instagram_business_manage_insights` and Meta App Review, and both need our own
snapshots because Instagram keeps no history of them. **v3:** per-post Instagram
metrics, story insights, suggestions, and a cook event to end the funnel.

**Open:** whether `this_week` / `this_month` are rolling or calendar windows —
verify with a real call before designing v2's labels.

## 13. Plan my week

**Status:** `built, PR open` — app #608, backend #419 (`GET /me/meal-plan/suggestion`)

The meal planner drafts the rest of the week from the user's saved, liked and own recipes:
no recipe twice in a week, nothing from the last 14 days while something fresh fits, no same
category two days running. The user swaps or shuffles before **Add to plan**; nothing is
written until then, and Undo removes exactly what was added.

**Open:** dietary filters (the draft ignores them), and an on-screen check against the
prototype with a signed-in account that has saved recipes.

## 14. Every recipe in every app language, with nutrition

**Status:** `built, PR open` — backend #417 (all 14 locales stored), #416 (nutrition measured
on save)

A recipe is stored in all 14 app languages, not only the one it was written in, so a reader
sees it in their own language and search matches its name in every language. New recipes are
translated on save; a sweep fills in the backlog (2 recipes every 10 minutes).
Nutrition is measured as soon as a recipe is saved, closing the gap where new recipes showed
no values.

**Open:** no live translation has run yet — check `translation_sweep_tick` in the dev logs
after deploy.

## 15. Onboarding 2026

**Status:** `built, PR open` — app #604 (copy only claims what the app does, with a test that
blocks counts like "thousands of recipes"), #609 (redesign; board `Board · Onboarding 2026`)

Four slides — save from anywhere, cook hands-free, plan the week, cook with what you have —
with live art, autoplay and a single Skip in place of "Explore" and "Don't show again".

**Open:** the fridge slide uses a drawn camera frame; swap in a real photo if one is made.

## 16. Engineering backlog

`idea` — work on how the app is built rather than what it does, left for later
on purpose. Each line is what, why, and what decides it.

| What | Why | Depends on / open |
|---|---|---|
| App Attest and Play Integrity instead of relying on the envelope | The envelope key ships in every app, so it detects tampering but cannot prove a request came from a real install. | Apple and Google console setup plus a server-side verifier; a product decision. |
| Count voice time per user, not per credential | The backend caps one minted credential at the remaining budget, but a client that skips heartbeats and re-mints is never charged. | Charge or reserve seconds at mint, or charge the time between mints (backend). |
| Restore web sessions on `*.web.app` and `localhost` | The refresh cookie is `SameSite=Strict`, so from those origins a reload sends no cookie and the session is not restored. | Decide whether those origins matter; if so, `Lax` or `None` per host (backend). |
| Prune old refresh tokens | `refresh_tokens` gains a row on every renewal and nothing deletes expired or revoked rows. | A scheduled sweep (backend). |
| A lost renewal reply on native signs the user out | If the reply to `/auth/refresh` is lost, the app keeps only the spent token, and the grace window refuses it. | Retry the renewal once with the same token inside the grace window, or accept and document it. |
| Timer, alarm and onboarding stores into the DI container | They are device-scoped and work, but bypass the container. | Threading stores through plain modules such as `timer-controls.ts`. |
| Remove the legacy session key | Old installs still migrate from it on first read. | A minimum supported app version first, so older installs are not signed out. |
| Split the screens over 250 lines | They are under the 300-line block but hard to read; the gate lists them as a warning. | A visual check at every width for each split. |
| Code-split the web bundle | The web app ships one 7.7 MB (1.9 MB gzip) JavaScript file; the budget in `assert-bundle-size.mjs` stops growth but does not shrink it. | Route-level lazy loading on web, and a check that prerendered pages still hydrate. |
| Rename `HttpMediaType.cookieSession` | It is the value of a session-mode header, not a media type. | None; small. |
| TanStack Query | Evaluated in October 2026 and not adopted: it fights the Result-not-throw model and made tests flaky, and the stores already cache, page and drop late answers. | Revisit only for a concrete need. |

## Adding to this file

Keep the shape: **what**, **why**, **what it depends on**, **what is still
open**. An entry that only says what would be a wish list. The open question is
usually the most valuable line — it is the thing that decides whether the item
is a day or a month.
