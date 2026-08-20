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

---

## Writing about the build marker triggered a build

**Symptom:** a merge to `dev` built and shipped both an Android APK and an iOS
IPA, minutes after being told to stop building iOS. The merge was a bug fix; no
one had asked for either build.

**Root cause:** the dev-distribution gate scanned the ENTIRE merge commit message
for `[dist]` / `[dist:android]` / `[dist:ios]`. The commit in question was the
one that made iOS opt-in, and its body explained the markers by name — so a
sentence *about* the feature was read as an *instruction* to use it. The same
paragraph that documented the change requested the thing it was documenting.

*Guard:* only the commit's **subject line** is scanned now, which is where a tag
belongs; a body can discuss the markers without invoking them. `CLAUDE.md` states
the narrower rule, and says why.

**The lesson: a trigger that matches free text will eventually match prose about
itself.** Anything scanned for a magic token — commit messages, PR bodies, chat
text, log lines — needs the token confined to a position that carries intent, not
merely a substring match. The failure is silent, arrives later, and looks like
someone else's mistake.

---

## A replaced framework context hid the file the framework reads

**Symptom:** on iOS, "Share to Recipely" from Instagram opened the app on
expo-router's **Unmatched Route** page showing
`recipely-dev://dataUrl=recipely-devShareKey?nonce=…`. The import never started.

**Root cause:** `+native-intent.tsx` — whose entire job is rewriting exactly that
URL — was correct and never ran. `route-context.js` replaces `expo-router/_ctx`
so co-located page code does not become routes, and its exclusion list was
copied from upstream's **web** context, which excludes `+native-intent`. The
native contexts admit it, because expo-router reads `redirectSystemPath` back
out of the context by key (`getLinkingConfig`). Excluding the file did not skip
a route; it unplugged a hook, silently, with nothing logged.

*Guard:* `check:structure` rule Q — every root `+file` the stock native context
would admit must be admitted by ours. Plus a unit test on the regex itself.

**The lesson: when you replace a framework's module, you inherit every use the
framework has for it, not the one you replaced it for.** A filter written to
answer "what is a route" was also answering "where is the linking hook", and the
second question had no error path — the feature simply behaved as if it had
never been written. Before narrowing a framework-owned collection, grep the
framework for who else reads it.

---

## The crash reporter was installed after the app had already started

**Symptom:** none visible — which is the point. Crashes were being lost with no
sign that anything was missing.

**Root cause:** three holes at once. `@react-native-firebase/crashlytics`
installs its global `ErrorUtils` handler and unhandled-promise-rejection
tracking inside its **module constructor**, and nothing constructed it until
`AppBootstrap`'s effect ran — so every throw before the first render went to
React Native's default handler and reached Firebase as nothing. On iOS the
library's config plugin is Android-only, so no dSYMs were ever uploaded and any
report that did arrive was unsymbolicated hex. And a process the system kills
outright — OOM, an ANR resolved by a kill, `SIGKILL` — runs no handler at all,
so it produced no report by construction.

*Guard:* `installCrashHandlers()` runs from `index.js` before
`expo-router/entry`; `plugins/withIosCrashlyticsDsym.js` adds the upload phase;
`CrashSentinel` reports a session that vanished without backgrounding, naming
the breadcrumb it died on, at the next launch.

**The lesson: instrumentation that is not itself verified is indistinguishable
from working instrumentation.** An empty Crashlytics dashboard reads as "no
crashes" and means "no reports". Anything whose job is to notice failure needs a
deliberate test that it fires — install it at the entry point, and prove a
report arrives before trusting the silence.

---

## The screen that crashed was not the screen with the bug

**Symptom:** on Android, tapping "Taslağı aç" on a finished Instagram import
closed the app — back to Instagram, and unopenable without force-quitting it.
Three sessions of reading the import and editor code found nothing, because the
defect was in neither.

**Root cause:** `removeClippedSubviews={Platform.OS === 'android'}` on the recipe
feed's `FlatList`. The prop moves child views in and out of the native hierarchy
outside React's reconciliation, which the New Architecture does not tolerate:
`IllegalStateException: addViewAt: failed to insert view [332] into parent [338]`,
thrown from `ReactClippingViewManager.addView` — the class that exists to
implement this prop, and the only code path in RN that re-parents behind Fabric's
back. The feed is the screen *underneath*: a share intent pushes the import over
`/recipes`, so when the stack transition to the editor finished, the feed
re-laid-out, re-clipped, and handed Fabric a child it had already parented
elsewhere. Opening the same draft from My Recipes never crashed — a different
list, without the prop, sits under that route.

*Guard:* `check:structure` rule R bans the prop outright; a regression test pins
the feed, asserted with `Platform.OS` forced to `'android'` — under Jest's default
`'ios'` the expression is already `false` and the test passes against the unfixed
code.

**The lesson: a crash names where the process died, never what was asked of it.**
What broke the three-session deadlock was not more reading — it was breadcrumbs.
The trail stopped at `import: draft fetch started`, which placed the crash inside
a stack transition rather than in the fetch or the editor render, and that is what
turned attention to the screen below. Instrument the flow before theorising about
it, and suspect the neighbours of the screen you are looking at.

---

## The app sent a request the server was always going to refuse

**Symptom:** publishing a recipe with a photo from the camera roll failed with
"file too large".

**Root cause:** nothing between the picker and the multipart body ever looked at
the size. `ImagePicker` hands back the original capture — 4032px and several
megabytes on a recent phone — and `quality: 0.85` re-encoded it without touching
the dimensions, which is where the bytes are. Ten of those in one recipe cleared
any per-file limit and the proxy's whole-request cap as well.

*Guard:* `shrinkForUpload` bounds the long edge and re-encodes once, before the
URI ever reaches the editor — so the file the draft carries is the file that gets
uploaded. Covered by tests for both orientations, the already-small case, and the
failure path (which returns the original rather than losing the photo).

**The lesson: a client-side limit is not a duplicate of the server's, it is the
only one that can produce a good outcome.** The server can only refuse; the
client is the only place that can make the request acceptable in the first place.
Any upload path needs its own ceiling, chosen to sit under every limit along the
way — per-file, whole-request, and proxy — rather than matching whichever one
happened to reject it first.

---

## A build that only production ever ran

**The iOS release died in `pod install`, before compiling anything.**
A config plugin added the Crashlytics dSYM upload phase with
`inputPaths: ['${DWARF_DSYM_FOLDER_PATH}/${DWARF_DSYM_FILE_NAME}']`. `xcode` writes an
inputPaths entry into the pbxproj **verbatim**, and unquoted `${A}/${B}` is not one
plist token — CocoaPods stopped with `Array missing ',' in between objects`. The same
file already used the nested-quote form twice (`'"dwarf-with-dsym"'`, and every path in
the shell script); this one line missed it.

**Then quoting it revealed the actual bug.** With the entry finally parseable, Xcode
honoured it — and the archive failed with `Cycle inside Recipely`: embedding
`ShareExtension.appex` waits on the dSYM phase, the dSYM phase waits on the app's dSYM,
and the dSYM waits on the app being linked with the extension embedded. The fix was not
to quote the input but to **not declare one**: the upload script already receives the
dSYM path in its own arguments, so the declaration bought nothing and cost a dependency
edge. The plugin's own comment had said so all along — "the phase has to read it
afterwards rather than declare it as an input file" — while the code did the opposite.
A comment that contradicts the line beneath it is a bug report nobody filed.

The interesting part is neither failure, it is *why they reached production*. Dev iOS
builds are opt-in and default to false, so between the day the plugin landed and the
day it shipped to TestFlight, **no iOS job ever ran it**. Every gate was green the
whole time because no gate exercised that path. A branch that CI does not walk is not
covered by CI, however green the checkmarks are.

*Guard:* `plugins/__tests__/withIosCrashlyticsDsym.test.js` pins the phase to zero build
inputs and still asserts every emitted value is quoted; both fail against their
respective unfixed versions. And because config is not the artifact, both iOS jobs run
`plutil -lint` on the **generated** `project.pbxproj` right after prebuild, so a
malformed project is one line of CI output instead of a CocoaPods stack trace. Same
reasoning as the Info.plist background-audio assertion beside it.

*Class:* when a platform's build is opt-in, its plugins are untested until a release
runs them. Anything that rewrites a generated native project needs a check on the
generated file, in the job that generates it — and a run-script phase that declares a
build product as its input will deadlock any target that embeds an extension.

---

## The notification that outlived what it pointed at, again

**Symptom:** an Instagram import finishes and notifies. Publish the draft it
produced, then tap that notification: an error, instead of the recipe that
exists. Reported from a device, not caught by anything.

**Root cause:** nothing recorded what the draft became. Publishing was two
unrelated calls — `POST /recipes` and then a client-side
`DELETE /recipes/drafts/:id` — and the server was never told the second was a
consequence of the first. So `Notification.draftId` kept naming a row that
publishing had removed, with no way to resolve it forward. A second, quieter
defect sat behind it: `Notification.target` read `draftId` **before**
`recipeId`, so even once the server knew the recipe, the draft would still have
won.

*Guard:* `fromDraftId` on create. The server repoints that draft's
notifications at the new recipe and deletes the draft in the same operation —
and **clears** `draftId` as it sets `recipeId`, so clients already in the field,
which read the draft pointer first, land on the recipe too. `target` now ranks
recipe above draft. Three cases in `notification-entity.test.ts` (two fail
against the unfixed getter), two in `build-create-recipe-form-data.test.ts`,
four in the backend's `create-recipe-use-case.test.ts`.

**The lesson is that this is the same class as ["Taslağı aç" opened a blank AI
prompt screen](#taslağı-aç-opened-a-blank-ai-prompt-screen), and the first fix
only handled the easy half.** That one taught the pointer to say "it is gone";
it never asked what the thing had *turned into*. A pointer whose target can be
transformed rather than merely deleted needs somewhere to record the
transformation — otherwise every consumer is left guessing, and the graceful
"it's gone" message is a dead end wearing good manners. When a fix handles
deletion, ask whether the target can also become something else.

---

## The strip the tab bar left behind

**Symptom:** moving between screens showed black bands — reported as "weird
things happen going from screen to screen". Visible on a device recording, not
in any test: during a push into a recipe, the area the bottom tab bar had
occupied went black for the length of the transition.

**Root cause:** the tab bar is a sibling of the `Stack`, not a navigator of its
own, and `RootTabBar` returns `null` the moment the route becomes a tab-less
one. So the strip is vacated *immediately* while the stack transition still has
250ms to run — and nothing was painting it. The root had no container `View`
with a background, and `expo-system-ui` was a dependency the app never called,
so the native window kept the platform default. What showed through was
Android's black.

The stack itself was innocent: `contentStyle` and the navigation theme were
both already derived from the palette, which is why this survived the earlier
"navigator painted its scenes in a colour the app never uses" fix. That one
covered the scene; nothing covered the space *outside* it.

*Guard:* a themed container `View` wraps the stack and the bars, and
`useWindowBackground` pushes the active background to the native window on every
theme change. Three cases in `use-window-background.test.ts` pin that it paints,
repaints on a theme switch, and does not repaint when nothing changed.

**The lesson: a component that unmounts instantly leaves a hole for as long as
the animation around it runs.** Mount and transition are not on the same clock —
React removes the node in one frame, the navigator keeps animating for another
fifteen. Anything that disappears on a route change needs to ask what is
underneath it during that gap, and the honest answer is "the platform default"
until something is deliberately painted there.

---

## The landing page picked a language without asking

**Symptom:** a Turkish visitor opening recipely.net/about for the first time got
the English page, with the header switch as the only way to find the Turkish
copy — on a site whose whole pitch that week was "nine languages".

**Root cause:** `landing.js` opened with `var startLang = 'en'` and consulted
only `localStorage`. The browser's own language was never read, so "no stored
choice" meant English rather than "ask the platform". The same function then
wrote every language it applied back to storage, including the default one — so
the first load silently froze the page's language, and a visitor who later
changed their browser language would never be re-asked.

*Guard:* `deviceLang()` walks `navigator.languages` in preference order and
falls back to English only when the page has no translation for anything the
visitor reads; `applyLang` persists only when a click passes `persist`. Six
cases in `public/about/__tests__/landing-language.test.ts`, two of which fail
against the unfixed script. The test evaluates the real `landing.js` in jsdom
rather than a copy of its logic — there is no module boundary to mock, and a
reimplementation would have passed while the shipped file stayed broken.

**The lesson: a default is not the same as a detection, and storage is not the
same as a decision.** Both halves of this bug are the same mistake made twice —
treating "nothing chosen yet" as an answer instead of a question. The app had
already solved it properly (`LocaleService`: stored choice > device language >
default); the landing page was written separately and never inherited the rule.
When a surface outside `src/` renders user-facing copy, it needs the same
precedence, not a plausible-looking shortcut.

*Second trap in the same fix:* `/about/assets/*` is served
`max-age=31536000, immutable` and the filenames carry no content hash, so a
returning visitor keeps the cached script for a year. The HTML is `no-cache`,
which makes the `?v=` query on the `<script>` tag the only thing that delivers a
change to them. **Editing an asset under `public/` is not shipping it** — bump
the query in the same commit.

## A screenshot drew the chrome it should have captured

**Symptom.** App Review rejected 1.0.43 (694) under guideline 2.3.10 — *"revise
the app's screenshots to remove non-iOS status bar images."*

**Cause.** The store frames drew their own status bar instead of letting the
capture carry the real one: `9:41` and `5G` and a battery, set in the app's
Plus Jakarta webfont rather than SF Pro, with the signal bars not rendering at
all and no wifi glyph — an arrangement no iOS device has ever shown. Because
the band was painted over the capture rather than above it, the fake clock also
sat on top of the recipe screen's back button and the `5G` on top of the
bookmark icon, which is how a reviewer spots a composite in one glance.

The band existed to make the mock look like a real device. It could only ever
fail at that: every glyph in it was a guess at another platform's UI, re-guessed
in whatever font the export happened to resolve.

**Now.** The hub draws no status bar — the band above each capture is an empty
spacer and the island is the only device chrome, which is real hardware and
carries no claim. `check:structure` rule S fails on a clock or a radio label
(`3G`/`4G`/`5G`/`LTE`) reappearing anywhere in `fastlane/store-hub/`.

*The wider lesson:* store assets are shipped artifacts and rot like any other.
The rejected PNGs predate the hub that generates them, so they also still
carried star ratings and invented review quotes that the hub's own README had
already banned under 2.3.7. **Re-export; never re-upload what is in the folder.**

## One flag answered two questions, and the iPad got the phone

**Symptom.** On a 13" iPad the app rendered the phone layout stretched across
the screen: one recipe card per row, the single-column recipe detail, bottom
sheets glued to the bottom edge of a tablet. The wide layout the web has had
for months never appeared, and the App Store iPad screenshot showed it.

**Cause.** `isWebShell = isWeb() && width >= BREAKPOINTS.desktop` was the only
question the layout context could answer, and 38 files asked it. But it bundled
two unrelated things: *is there room for the wide layout* and *is the browser
chrome mounted*. An iPad answers yes to the first and no to the second, so
every consumer — grids, the columned detail, the max-width caps, the sheet
presentation — took the phone branch. Nothing was broken; the question was.

**Now.** Two flags. `isExpanded` is pure width, so any platform past the
desktop breakpoint gets the wide content layout and a Split View pane loses it
again on its own. `isWebShell` keeps its name and its old definition and is now
only asked about browser chrome: the sticky WebHeader, the absent TabBar, the
absent safe-area insets. Deciding per call site is the work — the tab bar,
the native app header, the safe-area paddings and the web header's search and
sort fields all deliberately stay on `isWebShell`, because a tablet keeps its
native chrome.

*The general shape:* a boolean whose name describes a PLATFORM will be asked
questions about SIZE, and it answers them wrong on the first device that is one
without the other. Name the capability, not the platform.

## A DTO asserted a field the backend does not always send

**Symptom.** "undefined min" on the recipe cards and "undefined dk" on the home
hero, on the live web app and in the iPad screenshots being prepared for the
App Store. Dev never showed it, which is what made it look like a display bug.

**Cause.** `RecipeListItemDto` declared `totalTimeMinutes: number` — required —
and the mapper passed it straight through. Every type from the wire to the
screen therefore claimed a number while the value was `undefined`. The backend
simply has no timing for some recipes (AI-generated and imported ones); dev's
seeded catalogue happens to have it for all of them.

TypeScript could not catch this and never will: **a DTO is an assertion about
the wire, not a check of it.** Whatever the mapper does not verify, the type
system will confidently repeat all the way to the UI.

**Now.** The field is optional on the DTO, the entity carries `number | null`,
the mapper turns absence into `null` at the boundary, and the three cards hide
the time chip instead of printing what they were handed. Covered by
`recipe-mapper.missing-time.test`, which fails against the pass-through.

*The wider lesson, and the second time today:* a declaration that promises more
than reality delivers stays wrong until something checks it. The morning's
version was a boolean named after a platform being asked about size; this one
is a wire field named required that is not.

## A controlled input nobody reset

**Symptom.** In the AI create flow, sending a refine instruction left the text
in the field. The next instruction had to be typed on top of the last one.

**Cause.** `RefineDock` is a controlled input — `chatInput` and
`onChangeChatInput` belong to `useRecipeGeneration` — and `setChatInput` was
only ever wired to typing. Nothing on the send path asked for a reset, so the
value simply stayed. Every piece worked; no piece owned the clearing.

**Now.** `submitFreeText` clears after it submits. Deliberately there and not in
`onSubmit`: a quick chip sends its own instruction and must leave whatever the
cook has half-typed alone, and `onSubmitRefine` appends the sent text to the
transcript before the request goes out, so clearing loses nothing.

*The class:* with a controlled input, "the field empties on send" is a
behaviour someone has to implement — it is not what the widget does on its own,
and the bug is invisible in every unit that is individually correct.

## A floor and a ratio, arguing about the same row

**Symptom.** On the web home, as soon as the window was wide enough for the
three-column hero band, a strip of dead space — about 100px at 1200 — opened
under it. All three blocks ended on the same line and the page then held empty
until "Browse cuisines".

**Cause.** Two sizes for one row. `WebHeroSection` carried a per-breakpoint
`minHeight` (440 above 1200) while the featured card is sized by its own
`aspectRatio`. The flex split hands that card ~538px at 1200, so the ratio asks
for ~336 — and a wrap container hands the surplus to free space after the line,
not to the cards. The floor read as reasonable in isolation: it came from the
design's frames, which quote heights for viewports where the card is wide
enough to reach them.

**Now.** The row states no height at all; the featured card's ratio is the
band's single source of shape and the other two blocks stretch to it — which is
what the mini-card's own comment already claimed.

**The second bug, caught in review.** The first fix gave the loading placeholder
the same ratio and called it done. But the placeholder had never rendered the AI
slot — harmless while both states were pinned at 440, and a ~140px reflow the
moment the ratio was in charge, because the featured block is wider on a
two-block line and its height is now that width over the ratio. *Once a height
is derived, everything the derivation reads from becomes load-bearing:* the
placeholder has to reserve the same SLOTS, not merely the same ratio.

*The class:* [rule 6b](../CLAUDE.md)'s "divide by proportion; pin nothing" is
not only about a child fighting its parent — **a parent's floor and a child's
ratio are two sizes for the same box**, and they agree at exactly one width.
Design frames quote heights at the widths they were drawn at; translating them
into a floor rather than into the ratio is what carries the disagreement into
the code.

*Mechanical guard, considered and rejected.* A `check:structure` rule flagging a
`flexWrap: 'wrap'` container that also carries `height`/`minHeight` would land
green today and states something true (with Yoga's default `alignContent:
flex-start`, the surplus is always dead space after the last line). It is not
worth having: the offender here was an inline `{ minHeight: … }` object built in
the component body, not a `StyleSheet` entry, so a rule reading `StyleSheet`
blocks would have passed this very file — a guard that misses the case that
motivated it reads as coverage and is worse than none.

## A pair split one level too high

**Symptom.** The dev web deploy stopped going out. `Build Web (dev)` failed on
the commit that added the ad slots: *Importing native-only module
"react-native/Libraries/Utilities/codegenNativeComponent" on web from
react-native-google-mobile-ads*.

**Cause.** The ads SDK was already understood to be native-only — `AdsService`
had a `.web.ts` twin whose comment says, in as many words, that importing the
SDK on the web fails the build. But the split stopped at the service. `AdSlot`
imported `BannerAd` at module scope, and on the web `useAdsReady` answered
false, so the component rendered nothing and *looked* correct. Rendering
nothing is not the same as importing nothing: the bundler follows the import
either way.

Nothing local could see it. `tsc`, `jest` and `eslint` all resolve the native
file happily; only the web export walks the module graph the browser will get,
and it is not one of the four gates.

**Now.** `ad-slot.web.tsx` returns `null` and imports no SDK, with the shared
props in `ad-slot-props.ts` (rule 13). `check:structure` rule **T** makes the
pairing mechanical: a module importing a package on the native-only list must
be a `.web.*` file or have a `.web.*` sibling. Verified by deleting the new
file — the gate names it.

*The class:* **a platform pair has to be split at the module that IMPORTS the
native package, not at the one that owns the concept.** Splitting the service
answered "who decides whether ads run"; the bundler was asking a different
question, "who pulls this package into the graph", and the answer was a
component two layers up. When a dependency has no web target, trace every
module that names it — a conditional that renders nothing still bundles
everything.

## A 200 that was not the file

**Symptom.** AdMob would not verify app ownership: *"Bir app-ads.txt dosyası
oluşturmuş olabilirsiniz, ancak bilgileriniz eşleşmiyor."* Meanwhile
`recipely.net/app-ads.txt` answered **200**.

**Cause.** It answered 200 with the SPA's `index.html`. Hosting rewrites `**`
to `/index.html`, so a static file that is not there is not a 404 — it is the
app shell, with a success status and `text/html`. Every status-code check says
the asset is fine; only something that reads the body disagrees, which is
exactly what AdMob's crawler does.

The same rewrite had already done this once: `prune-web-export` deleted the
legal pages out of `dist` and /privacy quietly became the app shell.

**Now.** `public/app-ads.txt` exists, and `scripts/assert-public-assets.mjs`
runs at the end of `build:web`: every file in `public/` must exist in `dist/`,
or the build fails with the list. Existence in `dist`, deliberately, rather
than reachability over HTTP — reachability is the one question the rewrite
cannot answer honestly.

*The class:* **under a catch-all rewrite, "the URL responds" proves nothing.**
A missing asset and a working one are the same status code, so verify content
(or the artifact) rather than the response — and be suspicious of any check
whose passing condition a fallback route can satisfy by accident.

## A dependency that raised the floor under the native build

**Symptom.** Every Android build stopped compiling the moment ads were merged:
`:react-native-google-mobile-ads:compileReleaseKotlin FAILED` — *play-services-ads
25.4.0 … metadata is 2.3.0, expected version is 2.1.0*.

**Cause.** AdMob's native SDK is built with a newer Kotlin than Expo SDK 55
pins, and a Kotlin compiler refuses metadata from a version above its own. The
requirement arrived from the JavaScript side: `npm install` succeeded, and
`lint`, `tsc`, `jest` and `check:structure` were all green, because **none of
the four gates compiles a line of Kotlin**. Worse, mobile builds are opt-in on
`dev`, so a native dependency can sit merged and never once be built.

**The wrong fix, and what it taught.** Raising `android.kotlinVersion` to 2.3.0
looked like the direct answer. It moved the kotlin-stdlib *dependency* and left
the *compiler* at 2.1.0, so the build got worse rather than better: every RN
library failed, `react-native-safe-area-context` included, on *"compiler version
2.1.0 can read versions up to 2.2.0"*. The compiler version is not a build
property — moving it is an SDK upgrade.

That error line is also the measurement nobody had: the ceiling is **2.2.0**.

**Now.** `react-native-google-mobile-ads` is held at 16.0.0, which declares ads
24.6.0 with UMP 3.2.0 — a pair the library ships together, and one a
`resolutionStrategy.force` on either half would have split. Verified by an
Android build on the branch before the merge, not after.

*The class:* a package added to `package.json` can raise the floor under a
toolchain no JS gate touches, and "it installed and the tests pass" says nothing
about whether it compiles. No new mechanical gate — compiling native code is
not something the four can do. The guard is procedural: **ask for a real
Android build in the same session that adds a native dependency**, and read the
compiler's own version ceiling out of the failure before choosing a fix.

---

## Ads that never appear look exactly like ads that were never allowed

**Symptom.** The production Play build (1.0.47) showed no ad anywhere — not an
empty slot, no slot at all — while the dev build served test banners fine. AdMob
reported **zero requests**, so nothing on the console side could say why either.

**Root cause, in two halves, both of them "the reason was discarded".**

`AdSlot` handled a failed banner as `onAdFailedToLoad={() => setFailed(true)}`.
The SDK hands that callback an error whose message carries the code, and the
code is the entire diagnosis: **3 (no fill)** is a healthy account with no
inventory yet and needs patience, **1 (invalid request)** is a wrong unit id or
an app id that never reached the manifest and needs a fix. Both rendered the
same nothing.

`AdsService` cached the result of its one consent gather for the whole session
(`this.pending ??= this.run()`). A gather that **threw** — offline at launch, a
console still being configured — was stored as the same `false` a user who
declines produces, so one transient failure at launch silenced every slot for
the rest of the session and every later mount read the cached refusal instead of
asking again. "Could not ask" and "was told no" are different answers and only
one of them is final.

**Now.** The banner's error message goes to Crashlytics as a non-fatal, once per
unit per session (a feed carries a banner every ten rows; the first report has
the whole message). A gather that throws is reported, falls back to the consent
already stored on the device — the same `canRequestAds` Google's own sample
consults in its failure listener — and leaves nothing cached, so the next slot
retries. A refusal that the flow actually *returned* is still cached.

**And the retry had to be bounded before it shipped.** `prepare()` is called
from `useAdsReady`, which runs on every `AdSlot` mount — and a slot is a
FlatList row, so windowing remounts it every time it scrolls back into view. A
retry with no ceiling would have fired a native consent call *and* a crash
report per row for as long as a device stayed offline: the same flood the slot
half of this change dedupes against, one file over. Three attempts per session,
each failing step reported once.

*The class:* **a silent fallback with no reporting is untestable in production —
and "just retry" is a flood whenever the caller is a list row.**
Rendering nothing was always the right thing for the user to see; it was never
the right thing for us to see. When a code path's whole job is to fail quietly,
the failure has to leave somewhere else — a non-fatal, a counted event — or the
next outage arrives with the same single fact it had this time: "it doesn't
work." No new mechanical gate fits: no `check:structure` rule can tell a
deliberately-empty catch from a negligent one. The guard is the pair of
regression tests, and the standard is stated here.
---
## A button that promised a notification and only closed the screen

**Symptom.** After sending a reel to the importer, "Got it — notify me" produced
nothing: no notification when the import finished, none when it failed, and the
result only ever appeared as a number on the in-app badge.

**Cause.** Three things were true at once, and only the third was missing.

The backend was complete: `complete-import-job` and `fail-import-job` both
write a notification row *and* send an FCM push. The foreground handler was
already set to show banners. What no one had written was the middle: the
button was wired to `onClose`. Nothing ever asked the OS for notification
permission, so a user who had not already granted it was promised something
their device would never deliver — and the app said nothing about it.

Registration made it worse in a way that hid the hole: it runs once per cold
start and **gives up silently** when permission is missing, so even a user who
granted permission later had no token until the next launch.

**Now.** The button asks for permission at the moment it makes the promise —
which is also the moment the request makes sense to the user — and on a grant it
re-triggers registration through `ensurePushRegistration`, the same
mutable-handler seam the composition root already uses for `onSessionExpired`.
A refusal is said out loud instead of swallowed. `use-import-recipe.test` pins
all three and fails against the old wiring.

*The class:* **a promise in copy is a feature, and features have to be built.**
"You can close the app, we'll notify you" reads as a description of existing
behaviour, so nobody goes looking for the code that makes it true. When copy
asserts something, find the line that keeps it — and when a permission-gated
capability gives up silently, the giving-up is the part that needs a voice.

*Still true, deliberately:* iOS receives no push at all. `push-token-registrar`
returns early there because the backend addresses devices through FCM and an
APNs token needs `@react-native-firebase/messaging` plus a native rebuild. That
is a native dependency, and the call was to fix what exists rather than add one.

## Ads on screens with nothing on them

*Symptom:* AdSense served a policy notice on recipely.net — "ads shown on
screens with no publisher content", the category that also covers screens under
construction and ones used for navigation or behavioural purposes.

*Root cause:* two, of the same shape. `+html.tsx` loaded the AdSense script into
the shell that wraps **every** route, and the site declares no ad unit of its
own — so every ad it ever served was an Auto Ad placed on `/login`,
`/settings`, `/verify-code`, `/onboarding` and the rest. In the app, `AdSlot`
sat on the generate checklist and the import queue: a spinner, a stage list and
a progress bar, which is the same violation under AdMob's wording of the rule.
Both placements were argued for on product grounds — "the longest wait in the
app is where a banner is worth its space" — and the argument was about the user,
never about whether the screen had content to put an ad beside.

*Now:* the loader is gone from the shell, and both wait-screen banners are gone.
The feed banner stays: recipes are publisher content. `check:structure` rule T
fails on an AdSense loader anywhere under `src/` and on `<AdSlot>` rendered
outside an allowlisted placement, so the next one is caught before it ships.

*The class:* **a placement is a policy decision before it is a product one.**
"Where would an ad be least annoying?" and "may this screen carry an ad at all?"
are different questions, and the second has to be asked first — a wait screen is
the most tempting answer to the first and a forbidden answer to the second.

## The web served no ads at all, because nothing declared one

*Symptom:* AdSense reported recipely.net as approved and "preparing to serve",
and no ad ever appeared on the site.

*Root cause:* the fix for the previous entry removed the Auto Ad loader from
`+html.tsx` and left nothing in its place, because the site declared no unit of
its own — `ad-slot.web.tsx` rendered `null` and `AdsService` (web) answered
`false` to every request, so the feed built no ad rows either. Approved
inventory with no unit on the page serves nothing.

*Now:* the feed carries one AdSense display unit. `mountAdsenseUnit` builds the
`<ins>` and fetches the loader *with it*, so the script only ever runs on a page
that has an ad to show — never in the shell, which is what `check:structure`
rule T still fails on. The unit id arrives as `EXPO_PUBLIC_ADSENSE_WEB_FEED_SLOT_ID`
and only on the production deploy; blank means no element at all.

*The class:* **removing a policy violation is not the same as shipping the
compliant version of it.** The first half — take the ads off the pages that may
not have them — is what stops the notice, and it is the half that feels
finished. Nothing serves until someone does the second.

## The feed banner ran edge to edge while every card beside it was inset

*Symptom:* the ad between two recipe cards touched both screen edges, on both
platforms.

*Root cause:* an anchored adaptive banner asks the SDK for a size and defaults
to the DEVICE width, then renders at that width regardless of the padding on
its container. The list's `paddingHorizontal` had nothing to push against.

*Now:* the width is REQUESTED — `useFeedRows` publishes `mobileFeedRowWidth`
beside the unit id, `AdSlot` passes it to `BannerAd`, and the SDK returns a
creative built for it. The list's gutter is named (`MOBILE_FEED_GUTTER`) so the
two cannot drift. Clipping or scaling the view instead would alter a served ad,
which is what the network's policy forbids — so the slot carries no corner
radius however card-like its neighbours.

*The class:* **a native ad view is sized by what you asked the network for, not
by the box you put it in.** Layout props are a suggestion to something that
already decided its own dimensions.

## Every banner arrived a beat after the row it belongs to

*Symptom:* on every device, an ad appeared visibly later than the feed row
holding it, then pushed the content below it down.

*Root cause:* `useAdsReady` started at `false` and re-awaited `prepare()` on
every mount, even though `useAdsWarmup` had settled that answer at launch. So
each slot rendered `null`, resolved an already-resolved promise, set state, and
only then mounted the banner — a full render and a native view creation before
the ad request even left.

*Now:* a yes is remembered for the session and seeds the hook's initial state,
so the request leaves on the row's first render. A **no** is deliberately not
remembered: `AdsService` already tells "the user refused" from "nobody could be
asked" and retries only the second, and caching `false` in front of it would
turn one offline launch into a session with no ads.

*The class:* **an answer that is settled for the session should not be
re-awaited per consumer.** `await` on a resolved promise still costs a render,
and a render is exactly the beat a user sees.

## The permission the config asked for twice and the build shipped zero times

Turning the microphone on for the voice assistant, `app.json` named it in two
places: `react-native-audio-api`'s `iosMicrophonePermission` and, when that
produced nothing, a literal `ios.infoPlist.NSMicrophoneUsageDescription`. The
generated Info.plist carried neither.

*Why:* `expo-audio`'s config plugin runs `createPermissionsPlugin`, which
**deletes** `NSMicrophoneUsageDescription` when its own `microphonePermission`
is `false` — and it was, deliberately, from back when the app had no microphone
feature. A plugin that removes a key beats every plugin and every static entry
that merely sets one. iOS denies the first microphone access outright when the
purpose string is missing, with no prompt and nothing to show the user, and App
Review rejects a missing purpose string on its own.

*Now:* `expo-audio` is the single owner of the microphone. `check:structure`
rule N rejects the inert spelling on the other plugin by name, and requires
`microphonePermission` to be a non-empty string whenever `recordAudioAndroid`
is on. CI asserts the usage string is present in the **generated** plist,
beside the assert that has guarded `UIBackgroundModes` since §23c.

*The class:* **when two plugins touch one key, the one that removes it wins,
and a config that names something twice can still ship it zero times.** The
same lesson as §23c read backwards: there, config said no and the artifact said
yes. Check the artifact, in both directions.

## Two capability switches that default to on

`react-native-audio-api` was added for microphone streaming. Its config plugin
defaults `iosBackgroundMode` to true — adding `UIBackgroundModes: audio`, the
exact key that cost two App Review rejections under guideline 2.5.4 — and also
defaults `androidForegroundService` to true, declaring a mediaPlayback
foreground service and requesting the two `FOREGROUND_SERVICE` permissions Play
requires a written justification for. Neither was mentioned in the library's
README; both were found by reading the plugin.

*Now:* rule N covers this plugin too: both switches must be explicitly false,
and `androidPermissions` must be listed explicitly, because the default list
carries the foreground-service permissions even when the service is off. A bare
`"react-native-audio-api"` string with no options object is rejected outright,
since that spelling silently means every default.

*The class:* **read the config plugin, not the README, before adding a native
dependency.** The capability a library grants itself by default is the one
nobody writes down, and it lands in the artifact rather than the diff.

## A transport that connected, sent its setup, and heard nothing forever

The Live API transport passed every unit test — handshake, tool calls,
resumption, interruption ordering — and against the real server it would have
reached `setupComplete` never.

*Why:* the API sends its JSON in **binary** WebSocket frames, not text ones,
every frame including `setupComplete`. The transport read `typeof data ===
'string'` and dropped everything else as unparseable. The fake socket in its
tests sent strings, because that is what a fake naturally does, so the bug was
invisible from inside the suite.

*Now:* the socket asks for `arraybuffer` and the decoder accepts a string, an
`ArrayBuffer` or a typed-array view. The fake socket delivers **binary**, like
the real one, so the whole suite goes red without the fix rather than one test.

*The class:* **a fake that is more convenient than the real thing tests the
convenience.** Where a protocol has a wire format — framing, encoding,
endianness — the double has to reproduce it, or the suite is green about
something nobody ships.

## The setup nobody was listening to

The client built the session's whole configuration — system instruction, the
single `runAction` tool and its action enum, modality, transcription, sliding
window, resumption handle — and sent it in the setup frame. Measured against the
live API, none of it had any effect.

*Why:* with an ephemeral token, the setup baked in at mint time is
authoritative and the client's setup frame is a trigger whose contents are
discarded. Sending the full setup and sending `{ model }` produced sessions
identical down to the prompt token count. Worse in the other direction: a token
minted without tools, connected by a client that declared them, ran a session
with **no tools at all** and no error to say so — the assistant simply never
acted, and every explanation for that points at the prompt.

*Now:* the system instruction, tool list and action enum live on the backend
that mints the token; the client sends `{ setup: { model } }` and nothing else.
`languageCode` and the resumption handle are arguments to the mint. The mapper's
tests assert the deliberate **absence** of everything the plan had put there,
with the measurement written down beside them.

*The class:* **when a server takes the same configuration by two routes, find
out which one it obeys before writing the one that is easier to reach.** A
config that is ignored fails silently and looks, in code review, exactly like a
config that works.

## "You have used today's minutes" — to a user who had used none

The assistant panel told the user their daily voice allowance was spent. The
backend was simply unreachable; they had spent nothing, and the advice that came
with it — come back tomorrow — was wrong twice over, since an outage can clear
in a second.

*Why:* a refusal and an outage both land on the same `Unavailable` status. The
panel read the status and then guessed the reason, defaulting to the user's own
limit because that is the common case. The reason it needed was right there and
`null`.

*Now:* the choice is a pure function with the rule written into it — only a
STATED reason may claim a limit, everything else says voice is off without
saying why — and its test asserts the outage case is not the limit copy.

*The class:* **when two causes collapse into one state, the state cannot pick
the message.** A default that names the likelier cause reads as certainty to
the user, and it is the unlikelier cause that most needs the truth.

## A floating dock that landed on the tab bar

The assistant pill sat squarely over the third tab and swallowed taps meant for
it, on every phone-width screen that has a tab bar.

*Why:* it docked to the safe-area inset alone. The safe area describes the
hardware, not the app's own chrome, and this app draws a tab bar above it. The
timers bar had already solved exactly this and its computation was three files
away.

*Now:* the pill adds `controlSizes.tabBar` when a tab bar is actually present —
and only then, because routes without one (onboarding, auth, detail) would
otherwise float the pill off the screen edge.

*The class:* **the safe-area inset is not the bottom of the app.** Anything
docked to the bottom edge has to clear the chrome the app itself mounts there,
and the second widget to learn this should have copied the first.

## An assistant that could talk about the app and do nothing to it

The voice assistant shipped its transport, its session, its registry and its UI,
and answered every single tool call `unavailable_here`. Twenty-three actions
were offered to the model; zero had a handler. It transcribed, it decided, it
issued the command — and nothing happened, on any screen.

*Why:* the registry is deliberately open — screens register what only they can
perform — and nothing anywhere said the set had to be complete. Every gate was
green, because an empty registry is a valid registry.

*Now:* `check:structure` rule U compares the action vocabulary against every
`useAssistantAction` registration and blocks on a word nothing answers. Two
actions the plan invented were deleted rather than implemented — `writeBio`
duplicated `updateProfile`, and `repeat` is something a model does without a
tool.

*The class:* **a registry with no required members is a feature with no
required parts.** When the thing being built is a *set* of capabilities, the
completeness of the set is the requirement, and it needs a check of its own —
the individual pieces all passing says nothing about it.

## A hands-free assistant whose safety gates needed a hand

Every destructive action correctly stopped and asked — publish, delete, share,
attach a photo, accept a refine. None of them could be answered by voice. The
assistant is built for someone whose hands are covered in flour, so "shall I
publish it?" followed by a sheet only a thumb could dismiss was worse than not
asking: it stranded the user mid-task with a modal they could not clear.

*Why:* the confirmations were added as a safety property and reviewed as one.
Nothing about them was wrong in isolation — a `ConfirmSheet` is exactly right —
and the gap only exists in the scenario the feature is FOR, which no unit test
describes.

*Now:* `useAssistantConfirmation` registers a `confirm` / `cancel` pair for as
long as a sheet is open, and every sheet the assistant can raise uses it. The
gate is not weakened: a tool call happens because the user said yes, out loud,
to a question they were just asked about a sheet in front of them — the same
loop as a tap, with a different limb. Registration is scoped to `visible`, so a
stray "yes" with nothing pending answers `unavailable_here`.

*The class:* **a safety gate has to be answerable in the same modality it
interrupts.** Adding a confirmation to a voice flow and leaving it touch-only
does not make the flow safer, it makes it unusable — and the failure is
invisible to every test that does not act out the scenario.

## The action that worked until you visited the screen that also implements it

Opening My Recipes once and going back left "open the lentil soup" answering
`unavailable_here` everywhere, for the rest of the process — even though the
always-mounted assistant pill implements that action from anywhere.

*Why:* the action registry held one handler per key. A screen that implements
an action the pill already implements overwrote it on mount, and on unmount its
cleanup deleted the key. Nothing re-registered the outer handler:
`useAssistantAction`'s effect depends on the action and the registry, neither of
which changes. The one test that existed covered the opposite ordering — a
screen unmounting AFTER its replacement registered — so the normal case, where
the screen underneath stays mounted and should get the action back, was the
untested one.

*Now:* each key holds a stack. `register` pushes and returns a pop that removes
that handler wherever it sits; `run` dispatches to the top. Five actions are
implemented by two screens each, so this was five latent instances of the same
bug.

*The class:* **an override needs a way to hand back what it shadowed.** A
single-slot registry can express "this screen wins now" but not "and the other
one wins again afterwards", and the second half is the one nobody writes a test
for.

## Two confirmations, and the wrong one answered "yes"

On the create screen a user could ask for a refine, then ask to publish, read
the publish sheet, say "evet" — and have the AI's rewrite accepted instead. The
draft was silently replaced, nothing was published, and the model announced a
successful publish because the handler answered `ok`.

*Why:* both sheets registered `confirm`/`cancel` on the same keys, and the
winner was whichever effect re-ran last. Effect order tracks state changes, not
what is drawn on top — the refine proposal arriving after the publish sheet
opened took the word from a modal covering it. The hook's own doc block claimed
"the newest sheet wins, which is the one on top", which was not true and read
as though it had been thought about.

*Now:* a screen offers at most one confirmation at a time and decides which is
pending; the hook documents that as a requirement of its callers rather than a
property it provides.

*The class:* **registration order is not z-order.** Any "the topmost one wins"
claim made by something that cannot see the layout is a guess, and the guess is
wrong exactly when two things are pending — the only case that matters.

## Two ingredients in one breath, one row in the draft

"Add two eggs and 200 g of flour" left the draft holding the flour and a blank
row. The eggs were gone.

*Why:* the model sends both as tool calls in one frame, and the session queues
them so a later call sees what an earlier one did. It does not — not across a
React render. The queue chains microtasks; the re-render for the first
`onAddIngredient()` is a macrotask, so the second handler still read the
pre-render length and both writes landed on the same index. Adding a row and
filling it were two state updates.

*Now:* `onAddIngredient(value)` appends and fills in one update. The "+" button
still calls it with nothing, which is what a person tapping it wants.

*The class:* **serialising async work does not serialise the renders it
causes.** A queue that guarantees ordering between handlers guarantees nothing
about the state they read, and the gap is invisible whenever calls arrive one
at a time — which is every manual test.

## A safety list nothing read

`DESTRUCTIVE_ACTIONS` named the actions the assistant must never take on a
model's say-so, and no code anywhere imported it. `unsave` was on the list and
ran unconfirmed; the file documenting it said the opposite.

*Now:* it is `CONFIRMED_ACTIONS`, `unsave` raises a sheet like the rest, and
`check:structure` rule V fails the build if any member's handler does not
answer `awaiting`.

*The class:* **a declared invariant with no reader is worse than none.** It
reads, in review, exactly like a question that was asked and settled — so the
next person does not ask it either.

## The reconnect that was designed, documented, and never wired

The Live API drops its socket roughly every ten minutes by design, and the plan
answered that with a resumption handle: the server sends one, the client mints
a new token with it, and the conversation continues without paying for setup
and context again. The transport mapped the handle, the token port took it as a
parameter, the event union documented it — and the session store's `switch`
sent `Resumption`, `GoAway` and `Usage` to `default: break`. Nothing ever
supplied the handle. Every voice session died on a timer, silently, and looked
like the socket had failed.

*Why:* the path was built end to end EXCEPT the one line that consumes it, and
every piece that exists is individually correct. `default: break` is also the
right shape for an event union that will grow — it is what stops a server-side
release from breaking the app — so nothing about it reads as unfinished.

*Now:* a `goAway` marks the next close as a handover; the close reconnects on a
freshly minted token carrying the handle, with the microphone and the player
left running so the user hears a pause rather than a stop. `Usage` is kept too:
the whole design is shaped by token cost, and the number that measures it was
being discarded. Four tests cover it, and all four fail without the fix.

*The class:* **a `default` that swallows is invisible to every check.** Ports,
types and mappers all prove a value can travel; none of them proves anyone
reads it. Where a union's variants are the feature, each one wants a test that
asserts something happened — not merely that it type-checks.

## "Stop" during a reconnect opened a session nobody could end

Saying "stop" while the assistant was handing over to a fresh socket tore the
session down — and then, a moment later, opened a new socket anyway. The
microphone was already closed, so nothing was heard; the pill showed idle, so
nothing offered to end it.

*Why:* the reconnect awaits a mint and then a connect, and the user can speak
during either. Both awaits returned into a world where the session they belonged
to no longer existed, and neither checked.

*Now:* every start and every teardown bumps an epoch, and the reconnect
compares it after each await — returning if it changed, and closing the socket
it just opened if the change happened during the connect.

*The class:* **an await is a place the user can act.** Any async sequence that
outlives a user-cancellable operation needs to re-check that it is still wanted
after each suspension, not only before the first one — and the test for it has
to interleave the cancel, which no test of the happy path ever does.

## An optional parameter, and the "+" button pushed an event into a string array

Adding a value parameter to `onAddStep` so the assistant could append a filled
row broke the ordinary button beside it: the "+" is wired `onPress={onAdd}`,
and React Native calls `onPress` WITH the gesture event. Tapping it pushed a
`GestureResponderEvent` into `instructions: string[]`, which rendered as an
object in a `TextInput` and rode into publish.

*Why:* the prop is declared `() => void` at three levels between the button and
the hook, so a handler that accepts a first argument still satisfies every one
of them — TypeScript allows a function of fewer parameters where more are
expected, and this is the mirror of that rule. No test covers the "+" button.

*Now:* the blank append and the filled append are two functions.
`onAddIngredient()` takes nothing and can never receive anything;
`onAppendIngredient(value)` requires it. The hazard is structural rather than
patched at one call site.

*The class:* **never give an optional leading parameter to a function that is
handed to an event handler.** The event arrives in it, the types cannot see it
because fewer-parameter functions are assignable to more-parameter ones, and
the value that lands is an object where a string was expected.

## The innermost screen denied what the outer one could have done

While My Recipes was open, "open the lentil soup" for anything not in the
current tab answered `not_found` — even though the always-mounted handler
underneath can open any recipe by name or id. On the Drafts tab the list it
checked was not even the same collection, so the entire feed was unreachable by
voice from that screen.

*Why:* the registry dispatches to the topmost handler only. The code's own
comment claimed "the feed's handler takes over", which was never true — it read
as a described behaviour rather than an assumption.

*Now:* a handler can answer `notMine` and the registry tries the one beneath
it. A thrown handler does NOT fall through: that is a bug in that screen, and
promoting the one underneath would run the wrong thing and look like it worked.

*The class:* **a comment describing a fallback is not a fallback.** Where one
layer narrows what another could have answered, the narrowing needs a way to
say "not mine" — otherwise the more specific handler silently removes
capability instead of adding it.

## A confirmation on a screen that was not showing it

The create screen registered its publish confirmation regardless of phase,
while the sheet that renders it sits after three early returns. In the prompt,
resuming and generating phases, `publishDraft` opened an invisible confirmation
that still accepted a spoken "yes" — the user agreeing to something they could
not see. The exit and save-error sheets could likewise be on screen while the
refine proposal held the word.

*Now:* every confirmation is scoped to the phase that renders it and to the
absence of any sheet drawn above it.

*The class:* **a confirmation's registration must be conditioned on the same
thing its sheet is.** An early return that skips the render does not skip the
effect, and the gap between them is a gate that accepts answers to a question
nobody was asked.
