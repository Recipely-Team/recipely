# Regressions — what broke, and what stops it next time

This file is the lesson, not the incident. Git history already records every bug and
its fix; what it does not record is the *class* of mistake, or which guard now catches
it. That is what belongs here, one row at a time.

Written per [CLAUDE.md rule 24](../CLAUDE.md). The discipline is:

1. a regression test that **fails against the unfixed code**,
2. a mechanical guard if one is possible — a `check:structure` rule beats a written
   standard, and a type that makes the state unrepresentable beats both,
3. a row here naming the class.

The point is that the four gates — `npm run lint`, `npx tsc --noEmit`, `npx jest`,
`npm run check:structure` — catch the next one of these before anyone takes a build.
A bug that only a device can find is a bug we pay for twice.

Keep this file short. If a row stops teaching anything, delete it.

---

## Async UI

**A response arriving out of order overwrote a newer one.**
Search-as-you-type keeps several requests in flight and the network is free to answer
them in any order, so the *last-arriving* answer won: a slow request for `kek` landing
after a fast one for `kekli` left the list showing results for a query the user had
already typed past.
*Guard:* `configureRecipeListStore.load` stamps each call with a sequence number and
only the newest may write. Covered in `recipe-list-store.test.ts` with a deferred
promise per request. **Any store that loads from a user-driven, debounced input needs
this** — the pattern is not specific to search.

**Rows were rendered as an answer to whatever question happened to be current.**
Search is a backend filter, so on the first keystroke the store still held the
unfiltered feed — and the search surface listed the whole catalogue as the match for
one letter. The state knew the rows but not what they answered.
*Guard:* the loaded state carries `query`, the search its rows answer, and the screen
hands rows over only while that matches what is typed. **A cache entry should carry the
question it answers**, not just the answer.

**A one-frame gap claimed to be idle.**
The debounce settles during render while the request is only marked in flight by the
effect that follows — one frame with no rows and nothing claiming to load, which is
long enough to flash "no results" at the start of every search.
*Guard:* the loading flag is derived from "do the rows answer the current query", not
from the debounce window. Derive loading state from **data identity, not from timers**.

**A pending debounce resurrected deleted data.**
"Leave without saving" sent the delete while the autosave timer armed by the user's
last keystroke was still pending; it fired afterwards and upserted the draft back into
the list it had just been removed from.
*Guard:* `useDraftAutosave` returns a `cancel()` the discard calls first, as a ref flip
rather than a state change — the delete goes out on the next line, before any
re-render. **A debounced writer needs a way to be called off**, not just to be unmounted.

## Native / platform

**A `Modal` without `statusBarTranslucent` shifted the screen underneath.**
`edgeToEdgeEnabled` is on, so Android re-lays-out the window around the status bar as
the modal opens. Reported as "the layout jumps when I leave a draft". The dialog faded
rather than slid, so the existing sheet check (rule L) never looked at it.
*Guard:* `check:structure` rule **M** — every `<Modal>` under `src/` must set it. Adding
the rule immediately found two more files. See also [CLAUDE.md §23b](../CLAUDE.md).

**The navigator painted its scenes in a colour the app never uses.**
`ThemeProvider` was handed the stock `DarkTheme`, whose background is `rgb(1,1,1)`,
while every dark theme the app ships is a deep colour. The screens slide across that
container during a push, so the gap between them flashed black.
*Guard:* `navigationTheme()` derives the navigation theme from the active palette, plus
an explicit `contentStyle`. Covered in `navigation-theme.test.ts`. **A third-party
component with its own theme is a second source of truth** — adapt it, don't accept it.

**`replace` only replaces the top of the stack.**
Continuing without an account went `/onboarding` → push `/login` → replace `/recipes`
and left `[onboarding, recipes]`, so one back gesture returned a guest to the screen
they had just declined.
*Guard:* `enterApp()` pops to the root before replacing. **"Land here" and "replace this
screen" are different intentions**; only one of them is `router.replace`.

## Parsing and display

**A greedy quantifier ate half a word.**
The ingredient unit pattern was `[letters]{1,6}` with nothing anchoring it to a word
end, so `3 yumurta` parsed as the amount `3 yumurt` and the ingredient `a`.
*Guard:* a `(?![letters])` lookahead, and 11 tests in `parse-ingredient.test.ts` where
there had been none. **A greedy quantifier over letters needs a boundary**, and any
pure function that splits user text deserves a table of cases.

**Bailing out on an odd input silently removed a feature.**
The same parser gave up when the unit pattern consumed the whole line, so short
ingredients — indistinguishable from a unit — lost their amount badge entirely while
longer-named rows beside them kept theirs. Nothing looked broken; it looked
inconsistent.
*Guard:* it falls back to the amount alone. **An early return is a product decision.**

## Integration

**A URL the server gave us is not a file we can upload.**
The Instagram importer started returning a cover it had already stored
(`https://…/uploads/imports/<uuid>.webp`), so the editor showed a picture — and
publishing would have tried to upload it as though it were a device photo,
asking `FormData` for a file that was never on the device. The create route
already took a plain `image` field for exactly this, so nothing needed to change
server-side.
*Guard:* `isHostedMedia` splits the gallery, and eight tests across
`build-recipe-input` and `build-create-recipe-form-data` pin which half travels
as a file and which as a field. **When a payload gains a second provenance,
the code that consumes it has to learn the difference** — the two look
identical in the UI and identical in the type.

## Backend

**Search only matched the alphabet the developer typed in.**
Turkish written without diacritics found nothing (`sut` missed `Süt`, `pogaca` missed
`Poğaça`), and a multi-word term was one `LIKE` of the whole phrase, so `kakaolu kek`
matched and `kek kakaolu` did not.
*Guard:* one `folded()` SQL fragment applied to **both** sides of the comparison, and
per-word matching. Verified against the dev database, not only against a mocked Prisma
— the unit tests could not have told a valid statement from an invalid one.

## Store submissions

**A capability declared in `Info.plist` with no feature behind it.**
`UIBackgroundModes: ["audio"]` was carried for timer alerts, which Apple names as an
invalid use in guideline 2.5.4. Rejected at review, not at build.

**And the fix that fixed nothing.** The key was deleted from `app.json`'s
`ios.infoPlist` — and the next build was rejected for the same thing. `expo-audio`'s
config plugin defaults `enableBackgroundPlayback` to **true** and re-adds the key on
every prebuild, so the diff read correctly, the review notes read correctly, and the
artifact never changed. Two review cycles were spent on a config file nobody had
compared against its own output.
*Guard:* `check:structure` rule N on the plugin options, plus a CI step asserting on the
**generated** Info.plist after `expo prebuild`. **Config is not the artifact.** When a
build tool transforms your input, the guard belongs on the output — anything else
verifies your intent rather than what ships. Also worth naming: a fix that cannot be
observed anywhere except in the diff has not been verified at all.

---

## One word, written down in three places

**Symptom:** none visible — which is the point. `Failure.code` was typed `string`,
and the same vocabulary was spelled out independently by the failure classes
(`readonly code = 'conflict'`), the response mapper (`case 'conflict':`) and the
presentation copy table (`CODE_TO_KEY`). A typo in any of the three compiled
cleanly and fell through to the generic "something went wrong" wording at
runtime. The same shape repeated for store statuses (`'idle'` in eleven stores),
platform checks (`Platform.OS === 'web'` 33 times) and failure messages typed
inline at the point they were thrown.

**Root cause:** a vocabulary with no single definition. Each site was individually
correct, so nothing ever failed; the copies could only drift, never disagree
loudly.

*Guard:* `check:structure` rule **P** rejects a status literal outside
`store-status.ts` and a `Failure` built from an inline sentence instead of
`DiagnosticMessage`. `CODE_TO_KEY` is a `Record<FailureCode, …>`, so a code
without copy is now a compile error. `every-failure-has-copy.test.ts` asserts
every code and every backend `messageKey` resolves to a non-empty title and body
**in both languages** — the compiler can see that a row exists, not that it has
words in it.

**The lesson is about what "correct" hides.** Duplicated knowledge does not
announce itself the way a bug does: there is no failing case to find, only a
future edit that will update two of the three copies. Type the vocabulary so the
compiler holds the copies together, and where it cannot reach — a translation
file, a generated artifact — put a test on the output rather than the intent.

---

## A list that stops at one page, twice

**Symptom:** a user with more than 20 drafts saw 20 and no sign the rest existed —
no spinner, no end-of-list, nothing to scroll toward. Identical in shape to the
recipe feed, which had shipped the same defect and been fixed one layer down.

**Root cause:** `page: 1` written as a literal in the store, and the `total` the
repository returned thrown away on arrival. The repository was already correct;
the caller simply never asked for anything else, and no type objected because
`page` is a number and 1 is a number.

*Guard:* `drafts-paging.test.ts` asserts the SECOND request carries page 2, that
the rows append rather than replace, that `hasMore` closes when the list is
complete, and that a failed append leaves the loaded rows on screen. Verified
against the unfixed store: four of the six go red.

**The lesson is that fixing an instance is not fixing the class.** The recipe
feed was fixed by moving paging into the repository's caller; nobody asked which
*other* lists had the same shape. When a defect is found, grep for its shape
before closing it — every list, every `page:`, every discarded envelope.

---

## A TODO comment that shipped as UI text

**Symptom:** the alarm screen rendered `⏰ // TO DO: 1 emoji constants
dosyasına taşınabilir.` to the user.

**Root cause:** the note was added inside JSX children, where `//` is not a
comment — it is literal text. It type-checked, linted and tested clean, because
by every tool's reckoning it was a perfectly valid string.

*Guard:* none mechanical; a JSX text node cannot be distinguished from intended
copy. What catches this class is rule 11 — every user-visible string comes from
`t()` — so a bare literal in JSX is already a review finding regardless of what
it says. Worth remembering: **a comment marker only means "comment" in some
positions**, and JSX children are not one of them.

---

## A constant nobody read, and a key nobody noticed

**Symptom:** none — and that is what made it dangerous. `SecureTokenStorage`
persisted the session under `'layerly.session.v1'`, a name left over from an
earlier project, written as a local `const` inside the class. Meanwhile
`SESSION_STORAGE_KEY = 'recipely.session.v1'` sat in the shared constants file
and **nothing imported it**. Every other key in the app is `recipely.*`.

**Root cause:** the implementation bypassed its own constants file, so the two
could not disagree loudly — one was simply unused. A dead-code sweep is exactly
the moment this gets "tidied up" by pointing the class at the constant, which
would have **signed out every user holding a session**, with nothing failing in
CI to say so.

*Guard:* `session-key-migration.test.ts` — a session written under the legacy key
is still readable, is moved to the current key on first read, is not consulted
once a current session exists, and both keys are cleared on sign-out.

**The lesson is that an unused export is a question, not a verdict.** Deleting
it is one answer; the other is that something is reading a value it should have
imported. Ask which before reaching for the delete key — the dangerous
duplicates are the ones where only one copy is live.

---

## A user's own "no" reported as an error

**Symptom:** tapping "Continue with Google" (or Apple) on the login screen and then
dismissing the sheet without picking an account showed the form's error banner —
*"Bir şeyler ters gitti."* Nothing had failed; the user had simply changed their mind.

**Root cause:** the sign-in providers answered every non-success outcome with
`UnknownFailure`, so a dismissed sheet was indistinguishable from a broken one by the
time it reached the screen. Presentation had no channel on which to tell them apart
and did the only thing it could — render the generic "something went wrong" copy.

*Guard:* the vocabulary itself. `CancelledFailure` / `FailureCode.Cancelled` is now a
member of the failure vocabulary in its own right, the providers map both SDKs'
cancellation signals onto it, and `FailureCode` is a closed union — so a screen that
wants to stay silent has something to ask about, and nothing can quietly collapse back
into `unknown`.

**The lesson: an outcome the user chose is not an error, and the layer that knows
which it was has to say so.** Whenever an SDK, sheet, or picker can be dismissed, ask
what the abandoned path returns before assuming the `Failure` channel means something
broke. No mechanical rule can spot this one — the shapes are identical and only the
meaning differs.

---

## "Nothing here yet" said before the answer arrived

**Symptom:** opening My Recipes on a cold start showed an empty screen — the icon and
*"No saved recipes yet"* — for a moment, then filled in with the rows. The screen told
the user they had nothing and then contradicted itself. Nothing shimmered in between.

**Root cause:** the screen decided what to render by asking `items.length === 0`, a
question with the same answer before the request comes back and after it comes back
empty. Two of the three tabs had no load status to ask instead: `createdRecipesStore`
tracked no state for `loadMyRecipes`, and the saved grid was fetched by the screen
itself through a use case, so the store never knew a load was in flight.

*Guard:* the type. Both stores now carry an `Idle | Loading | Loaded | Error` state,
the fetch moved into the store that owns the rows, and `isFirstLoad(status, count)` is
the single predicate the list branches on — so "unanswered" and "empty" can no longer
be spelled the same way. `my-recipes-list.test.tsx` pins the skeleton branch over the
empty one for all three tabs.

*And the trap inside the fix:* a status that is re-entered on EVERY call cannot say
"first load". The first cut set `Loading` unconditionally, and this screen reloads all
three tabs on focus — so an empty tab flashed empty → skeleton → empty on every visit,
and a pull-to-refresh swapped out the `ScrollView` carrying the `RefreshControl`
mid-gesture. A list that is already `Loaded` now stays `Loaded` while it reloads, which
is the convention the recipe feed already used (`isRefreshing` / `isLoadingMore` live
INSIDE `Loaded`). An `Error` with nothing to fall back on renders the failure, not the
empty state — otherwise an offline cold open tells the same lie for a different reason.

**The lesson: an empty array is not an answer.** Any list that can render an empty
state needs a status that separates *nothing yet* from *nothing at all* — and the
status belongs to the store that owns the data, not to the screen that happens to
call the use case. A screen that fetches for itself cannot tell the difference.

---

## A tap that opened the wrong screen and sat there

**Symptom:** tapping a draft — in the My Recipes drafts tab, or the "pick up where you
left off" card — landed on the AI-generate prompt screen and waited there before the
draft finally appeared. It read as the wrong screen having opened, or as the tap not
having registered; on a slow connection it lasted seconds.

**Root cause:** `useRecipeGeneration` initialised every mount to the `prompt` phase and
only moved to `preview` after the `getDraft` request resolved. The phase a screen waits
in is the screen the user sees, and this one was waiting in a phase that means
something else entirely — an unrelated, fully interactive AI form.

*Guard:* `Resuming` is now a phase of its own, entered from the initial state when
`?draftId=` is present (and again inside the effect, for the `router.replace` the
resume card does), rendering a skeleton of the editor. A draft that cannot be read
falls back to `prompt` with a toast, so the wait always ends.

**The lesson: an async load must not borrow another state's screen while it waits.**
When a mount has to fetch before it can show its real content, the loading phase is
part of the state machine, not a gap in it — and the `?param=` that triggers the fetch
is known synchronously, so the first frame already has everything it needs to say
"loading" instead of guessing.

---

## An answer that outlived the session that asked for it

**Symptom:** none reported — found while reviewing the fix above, which is the only
reason it is here.

**Root cause:** `loadSaved` / `loadMyRecipes` / `loadDrafts` publish whatever comes
back, whenever it comes back. Signing out while one is in flight runs
`clearSessionCaches()` — and then the late response repopulates the store it just
emptied. For favourites that is the worst case: `savedIds` drives the bookmark on
every recipe card in the app, so the signed-out session (and the next user, until
their own load answers) shows the previous account's saves.

*Guard:* each of the three stores keeps a session counter that `clear()` bumps; a load
captures it before awaiting and drops its answer if it no longer matches. Each store's
suite holds a "discards a response that started before the session ended" case.

**The lesson: `await` is a place where the world can change.** Any store write after an
await has to ask whether the thing it is writing into is still the thing it was asked
about — and "the user signed out" is the version of that question with teeth, because
the data belongs to someone else. Related: [Session Cache Reset](../CLAUDE.md) — a new
user-scoped store must be registered in `clearSessionCaches`, and now also needs this
guard.

---

## Two timers, one effect, and a checklist that never moved

**Symptom:** caught in review before shipping. The Instagram import screen's
four-stage checklist — the thing that exists to prove a two-minute wait is alive —
would have sat frozen at stage zero for the entire import.

**Root cause:** the 4 s status poll and the 9 s stage tick were created in ONE
`useEffect` keyed on the job object. Every successful poll stores a freshly built
`ImportJob` (the mapper allocates a new object even when nothing changed), so the
object's identity changed every 4 s, the effect tore itself down, and the 9 s
interval was destroyed before it ever fired. The perverse tell: it only advanced
when polling *failed*, because a failed poll writes nothing.

*Guard:* the effect is keyed on the job's `id` and `status` — the fields it
actually cares about — not on the object. `use-import-recipe.test.tsx` drives it
with fake timers through a fixture that deliberately returns a **new object from
every poll**, because that churn is the entire mechanism; a fixture reusing one
reference passes against the broken code.

**The lesson: an effect keyed on a value from the network is keyed on a new
object every response.** Depend on the fields you branch on, not the payload
they arrived in — and when an effect owns a timer, ask what happens to that timer
on the re-render you did not think about. Two timers with different periods in
one effect is the shape to distrust: the shorter one silently starves the longer.

---

## The close button that closed the app

**Symptom:** on a dev build, leaving a screen reached from a share intent or a
notification quit Recipely instead of returning to it.

**Root cause:** `router.back()` on the ONLY screen in the stack closes the app on
Android. Every close button in the app used it, which is correct for a screen you
pushed yourself — and wrong for one the OS pushed for you. A share intent or a
notification tap on a cold start makes that screen the entire stack, so its X was
an exit door.

*Guard:* `useGoBackOrHome` asks `router.canGoBack()` and lands on the feed when
the answer is no. Both entry-point screens (import, create-recipe) use it, and
both suites hold a "nothing to go back to" case.

**The lesson: a screen the OS can open is a screen that may be the whole stack.**
Anything reachable from a share intent, a notification, or a deep link cannot
assume there is a behind to go back to — and the failure mode is not a stuck
screen, it is the app disappearing, which reads to the user as a crash.

---

## Errors the user saw and Firebase never did

**Symptom:** none visible — which was the problem. A crash report existed for
`unknown` and `server` failures raised through **toasts only**, so a failure
shown as a full-screen error state (the feed, notifications, recipe detail, an
import) reached the user and nobody else. A render-time throw was worse: it
unmounted the tree, showed a blank screen or closed the app, and reported
nothing at all.

*Guard:* three things. `AppErrorBoundary` catches render throws, records them
with their component stack, and offers a retry instead of a dead end.
`useReportFailure` reports at every surface that shows a failure, once per
failure rather than once per render. And `FailureReporter` gained a second sink:
**every** failure is counted as an analytics event while only the unforeseen ones
become crashes — so "how often does this happen" has a home that is not the
inbox for "what did we not predict".

**The lesson: coverage is a property of the SURFACES, not of the reporter.** A
reporting helper wired into one of five places is a reporting helper that lies
about what it knows. When adding a channel for errors, enumerate the ways an
error can reach a user and check each one — and give handled-but-frequent
failures somewhere to go that is not the crash inbox, or the filter that keeps
crashes readable will be the filter that hides the trend.

---

## A field that hid the half that mattered

**Symptom:** pasting an Instagram link on a phone showed
`https://www.instagram.com/p/` and nothing else. The part that identifies the
post — the only part worth checking — had scrolled out of the single-line field,
so users went back to Instagram to copy it again, twice, before trusting it.

**Root cause:** a one-line `TextInput` in a row that also holds an icon and a
Paste button. A URL is longer than what is left, and a single-line field solves
that by scrolling, which silently chooses to show the *beginning* — the part
that is identical for every Instagram link and therefore carries no information.

*Guard:* the field auto-grows and wraps, so the whole link is readable at once,
and a validated paste is echoed back in short form (`instagram.com/reel/Cx1y2z3`)
under the field. `use-paste-import-link.test.tsx` pins the echo, including that
it stays silent mid-typing and withdraws when the link is edited away.

**The lesson: truncation is a decision about which half to hide.** A field that
scrolls shows the start; a filename, an id or a URL usually carries its meaning
at the END. Before pinning a text box to one line, ask which half a user would
check — and if the answer is "the end", let it wrap or echo what was understood.

---

## "Taslağı aç" opened a blank AI prompt screen

**Symptom:** a finished Instagram import offered *Open draft*; tapping it — or
tapping the completion notification — parked the user on the empty
create-with-AI screen for a moment and left them there. It read as if the import
had failed, and the recipe it had actually produced was nowhere in sight.

**Root cause:** a dead pointer that nothing kept honest. The import job stores
`draftId` for good, and its notification carries the same id — but **publishing
a draft deletes it** (`recipe_drafts` has no soft delete). So a user who opened
the import, published the recipe, and later returned by either route read a 404
on `GET /recipes/drafts/:id`. The screen treated that like any other read
failure — toast, drop the param, fall back to `Prompt` — which is right for an
offline read and wrong for a row that is gone: there is nothing to retry, and
the blank prompt answers a question the user did not ask. Two dev jobs on
2026-08-08 pointed at drafts that had already become recipes.

*Guard:* the resume path branches on `FailureCode.NotFound` and lands on My
Recipes' drafts tab with copy that says the draft is gone, instead of the AI
prompt; a deleted draft is normal use and is no longer reported as a crash.
`use-recipe-generation.test.tsx` → "a draft that no longer exists" pins all
three, and fails against the unfixed hook.

**The lesson: a stored id is a claim about the past, not a promise about the
present.** Any pointer that outlives the thing it names — a job row, a
notification, a deep link, a cached route param — will eventually be followed
after the target is deleted. Decide what "it is gone" should DO before shipping
the pointer, and make sure that answer is different from "it could not be read".

---

## Opening an imported draft deleted most of it

**Symptom:** an Instagram import finished, the recipe opened — and the cover was
missing, with the editor saying "no photo yet". The frame existed: it had been
extracted, converted and written to disk, and was being served.

**Root cause:** the editor's projection was treated as the whole truth. An import
writes `image`, `category`, `tags`, `mealType`, `tips`, `nutrition` and
`caloriesPerServing`; the create screen models none of them, and the app's own
`DraftRecipeSnapshot` type did not even declare them. So `snapshotToEditable`
read only `media` — never `image` — which is why the cover was invisible, and
`editableToSnapshot` wrote only the nine fields the editor knows. **Autosave
fires on open**, so simply LOOKING at an imported draft overwrote the rich
snapshot with the narrow one. Measured on dev: imported drafts that had been
opened held 9 snapshot keys, untouched ones held 16.

*Guard:* the snapshot type declares the import's fields; `editableToSnapshot`
takes the snapshot the editor was opened with and passes them through untouched;
`snapshotToEditable` seeds media from `image` when the editor has none, so the
cover is visible and can be replaced. `drafting-mappers.test.ts` → "an imported
draft opened in the editor" pins all of it and fails nine ways against the
unfixed mappers.

**The lesson: a partial view must not be saved as if it were the whole record.**
Any screen that edits a subset of a document — and then persists the subset —
deletes the rest, silently and on open rather than on save. If the editor cannot
show a field, it still has to carry it; and a type that omits the field is what
makes the deletion invisible to the compiler, so the type is the first thing to
fix.

---

## A lighter orange square on the dark-mode splash

**Symptom:** launching in dark mode showed the Recipely mark sitting on a
lighter orange SQUARE, floating on a darker orange screen. Light mode was fine.

**Root cause:** two things that were each correct alone. `expo-splash-screen`
bakes the configured `backgroundColor` into the generated `splashscreen_logo.png`
as an opaque plate — the source asset's corner is fully transparent, the
generated one's is opaque `rgba(238,137,65,255)`. Separately, `Theme.SplashScreen`
descends from a light theme, so Android's **Force Dark** algorithmically darkened
the splash WINDOW in dark mode — and Force Dark does not touch bitmaps. Sampled
from a device screenshot: the square was `#EE8941`, the surround `#A14900`, a
colour that appears nowhere in this repo. Both `values/colors.xml` and
`values-night/colors.xml` carried the right colour, which is why reading the
config proved nothing.

*Guard:* `plugins/withAndroidSplashForceDark.js` writes a `values-night/styles.xml`
that opts both launch themes out of Force Dark. It is a night override rather
than a patch to `values/styles.xml` because two earlier attempts —
`withAndroidStyles`, then a dangerous mod rewriting that file — both patched
`AppTheme` and both silently lost the item on `Theme.App.SplashScreen`:
expo-splash-screen writes that style after every mod a config plugin can
register. `plugins/__tests__` pins every item the override must carry, since an
Android style override replaces the whole style.

**The lesson: verify the generated file, not the plugin.** Every attempt here
looked right in its own return value and was wrong in `android/`, twice in a row.
A build-time transform is only as true as the artifact it produces — so read the
artifact, and when the thing you are patching is written by someone else's mod,
stop fighting the ordering and pick a file they do not own.
