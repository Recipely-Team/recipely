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
*Guard:* nothing mechanical yet. If a native capability is declared, something in the
app has to need it — and removing one moves work to whatever depended on it (here:
a backgrounded timer alarm now rests entirely on scheduled local notifications, which
only a physical device can confirm).
