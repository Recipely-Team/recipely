# Handoff — work that is finished but not delivered

Written 2026-09-12. A DNS outage on the owner's machine stopped a session
mid-flight: `github.com` and `registry.npmjs.org` stopped resolving (raw IPs
still answered, so the network itself was up). Everything below is **written,
committed locally and green on every gate** — none of it is pushed, published
or merged.

Delete a section when it has landed. If a section's first step already appears
done, check the facts before repeating it — the outage may have ended
mid-sequence.

---

## A. Two branches waiting to be pushed

Both branch from `dev` at `75ec1e0b`.

| Branch | Commits | What it is |
|---|---|---|
| `chore/release-notes-1-1-10` | `2d9883e4` | The v1.1.10 release notes, in all six places they live |
| `feat/assistant-kit-publishable` | `1f0006c4`, `803591bd` | The library made publishable, plus the umbrella package |

- [ ] `git push -u origin chore/release-notes-1-1-10` and open a PR → `dev`
- [ ] `git push -u origin feat/assistant-kit-publishable` and open a PR → `dev`
- [ ] `code-reviewer` on each (CLAUDE.md requires it before a merge), then squash-merge

Gates were green on `803591bd`: `npm run lint`, `npx tsc --noEmit`,
`npx jest` (303 suites / 2616 tests), `npm run check:structure`.

---

## B. Release v1.1.10 — promote `dev` to `main`

The owner asked for this ("maine aktaralım kodu versiyon notları ile"). It is
the one flow CLAUDE.md lists as stop-and-ask, and the owner has asked, so it is
authorised — but read the caveat below before merging.

CI derives the marketing version from the last git tag. Last tag is `v1.1.9`,
so this release is **v1.1.10**.

- [ ] Land section A first — the release notes must be on `dev` before `main`
      is cut from it
- [ ] Open a PR `dev` → `main`. The frontend promotes by MERGE, not cherry-pick
      (`main` HEAD `13fa9356` is "Merge pull request #426 from Recipely-Team/dev");
      this is unlike `recipely-backend`, which cherry-picks
- [ ] Watch CI, then merge

### What merging to `main` sets off

1. `tag-release` stamps and pushes `v1.1.10`
2. **recipely.net** — production web build + Firebase Hosting deploy. **Public
   immediately**; this is the only public-facing half
3. **Play internal track** — signed AAB, release notes taken from
   `distribution/whatsnew/` (testers only)
4. **TestFlight** — signed IPA via fastlane pilot (testers only)

### The caveat to put to the owner before merging

`docs/assistant-library-plan.md` still has **"Test it on dev: the owner on a
device (iOS and Android voice)"** unchecked, and CLAUDE.md §27 says library
code stays on its own branch until the library is complete. The library reached
`dev` under an explicit "for testing" allowance, and the app can no longer be
promoted without it — PR #430 merged the library and the app's migration onto
it together.

So this promotion ships a voice stack whose on-device check has not been signed
off. The web half was exercised live against dev; the iOS and Android voice
paths have not been re-verified since the migration. The owner has been told
this once already and asked to proceed; tell them again if the device check is
still unchecked when this is picked up.

### What the release actually contains

Six commits since #426. User-visible, all reported by people talking to the
assistant:

- asking for a recipe that is on the screen opens **that** one — it used to say
  it could not find it, or open a recipe mentioned in an earlier turn (#429)
- it reads a recipe's steps aloud right after opening it (#429)
- "open my recipes" no longer answers "you have none" while the list is still
  loading, and a failed load says so instead of claiming the list is empty (#431)
- theme colours can be named in Turkish, not only in English (#431)
- signed out, the web header no longer draws placeholder initials as if an
  account were signed in (#427)

Underneath: #430 turned the assistant into a library and moved Recipely onto
it. The equivalence audit found no blocking regression; the budget heartbeat
used to stop reporting after the first `goAway`, so a long session stopped
being metered at its first reconnect. That is fixed by the migration.

### Release notes live in four places — only one is read by CI

This was stale for four releases and is worth not re-learning:

| Path | Read by |
|---|---|
| `distribution/whatsnew/whatsnew-{en-US,tr-TR}` | **CI** — `r0adkll/upload-google-play`'s `whatsNewDirectory`. This is what Play users see |
| `fastlane/metadata/{en-US,tr}/release_notes.txt` | App Store metadata, uploaded by hand |
| `fastlane/metadata/android/{en-US,tr-TR}/changelogs/default.txt` | nobody |

All six are current for v1.1.10 on `chore/release-notes-1-1-10`. Play caps a
locale at 500 characters; the two files are 395 and 422.

---

## C. Publish the library to npm

Decided by the owner on 2026-09-12: **MIT**, and the scope stays
**`@live-assistant/*`**. The packaging work is done on
`feat/assistant-kit-publishable`; what remains needs the owner's own account.

### The owner has to do these two

- [ ] `npm login` as the account that will own the scope — nobody else can
      authenticate for them
- [ ] Confirm `@live-assistant` is still free or already theirs. It was free on
      2026-09-11 and could not be re-checked on 2026-09-12 (DNS)

### Then, in dependency order

- [ ] `npm publish -w @live-assistant/core`
- [ ] `npm publish -w @live-assistant/gemini`
- [ ] `npm publish -w @live-assistant/audio`
- [ ] `npm publish -w @live-assistant/react`
- [ ] `npm publish -w @live-assistant/token-server`
- [ ] `npm publish -w @live-assistant/widget`
- [ ] `npm publish -w @live-assistant/react-native`

Each package's `prepublishOnly` runs its build, so `dist/` is fresh whether or
not anyone remembered. `publishConfig.access` is `public` on all seven — a
scoped package is private by default and the first publish would be refused
without it.

- [ ] Afterwards: install `@live-assistant/react-native` into a scratch Expo
      app from the registry and start it. Everything so far has been proved
      through the workspace, where Metro resolves the packages to their source;
      a real install is the first time the **published tarball** is exercised

### Measured facts — do not re-derive these

- **`publishConfig` cannot carry `main`/`types`.** npm 11 leaves those
  overrides out of the tarball. Verified by packing and reading the
  `package.json` inside it. The fields are set directly for that reason
- **The token server could not load at all before this work.** Every package
  pointed `main` at `src/index.ts`, so
  `require('@live-assistant/token-server')` failed on Node. It now resolves to
  `dist/index.js` and returns its five exports
- **Node cannot require `@live-assistant/react-native`** — it reaches React
  Native, whose source is Flow. That is expected, and the same reason the token
  server is a separate package. Test it under jest-expo or in an app
- **jest needs two mapper rules, not one.** The controller fixtures are
  imported by a deep specifier (`@live-assistant/core/src/controller/...`), and
  a single anchored rule sends them to the package index instead
- **`import/namespace` cannot lint the umbrella's `export *`** — it is disabled
  on that one line, with the reason written beside it

### Still open

- [ ] **The library wants its own repository before 1.0.0.** The packages carry
      no `repository` field, because pointing it at this repo would name the app
      and `check:structure` rule AD forbids a package naming Recipely. That is a
      real gap on an npm page, and the fix is a repo of its own — the owner's
      decision, not a code change

---

## If the session ends

1. `git branch -v` — the two branches in section A are local-only until pushed.
2. Check `curl -sI https://github.com` first. The whole reason this file exists
   is that it failed; if it still fails, nothing in sections A–C can proceed.
3. `docs/assistant-library-plan.md` is the library's own board and carries the
   phase-by-phase history; this file only carries what is undelivered.
