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
