---
name: release
description: Promoting Recipely to production — the app's dev→main release PR (merge commit, release notes in six files, tag + Play internal + TestFlight + production web deploy), the backend's cherry-pick promotion, and the opt-in dev Android/iOS build markers. Use when the user asks to release, ship to production, promote dev to main, update release notes, or build a dev APK/IPA. Promotion to main needs the user's explicit go.
---

# Release

## Stop and ask first

Promoting `dev → main` and any production web deploy (Firebase Hosting) are release decisions:
**never start one without the user's explicit go in this conversation.** `main` is release-only —
no feature PR ever targets it. Every push to `main` tags a version (`tag-release` job in
`.github/workflows/ci.yml` patch-bumps from the last `v*` tag) and ships to Play internal +
TestFlight, and deploys the production web build.

## App (this repo): release PR `dev → main`

Pattern from #447 and #449 (and #417, #420, #422, #426).

1. `dev` is green: lint · tsc · jest (note the suite/test counts) · check:structure · web export.
2. **Release notes**, English and Turkish, in the six files a release touches (see #446), written
   for users, about what changed since the last release:
   - `distribution/whatsnew/whatsnew-en-US`, `distribution/whatsnew/whatsnew-tr-TR`
   - `fastlane/metadata/android/en-US/changelogs/default.txt`, `fastlane/metadata/android/tr-TR/changelogs/default.txt`
   - `fastlane/metadata/en-US/release_notes.txt`, `fastlane/metadata/tr/release_notes.txt`

   In the same PR, run `npm run changelog`: it regenerates the developer-facing `CHANGELOG.md`
   from the `v*` tags, listing everything since the last tag under the version CI will stamp
   (last tag patch-bumped, marked "unreleased"). Never hand-edit it.

   These land on `dev` first through the normal `pr-flow` (`chore(release): …`).
3. Open the release PR from `dev` itself:

   ```bash
   gh pr create --base main --head dev --title "release: <what a user will notice>" --body "<body>"
   ```

   Body sections, as in #447: **What goes out** (in the order a user would notice, citing PR numbers),
   **Guards that came with them** (new `check:structure` rules, `docs/regressions.md` rows),
   **State** (gate results), and the line *"Merging this tags a version and ships to Play internal +
   TestFlight, and deploys the production web build."* End with the Claude Code attribution line.
4. Merge only on green, with a **merge commit** (release PRs are not squashed, and `dev` is not
   deleted):

   ```bash
   if gh pr checks <n> --watch --fail-fast; then gh pr merge <n> --merge; fi
   ```

   Re-run the watch if checks have not registered yet.
5. Report the PR number, the merge commit and the tag CI created.

A rejected store build is fixed on `dev` and re-released the same way (#449 followed #447).

## Backend (`recipely-backend`)

Follow that repo's `CLAUDE.md` step 7. `dev` and `main` there have diverged squash histories, so
promotion is a **cherry-pick**, not a merge:

```bash
git fetch origin
git checkout -b <branch>-to-main origin/main
git cherry-pick <dev-squash-sha>
git push -u origin <branch>-to-main
gh pr create --base main --title "<same as dev PR>" --body "Promotes #<dev-pr> to main"
gh pr checks <pr> --watch
gh pr merge <pr> --squash --delete-branch
git checkout dev && git pull --ff-only
```

`main` there is branch-protected on the `verify` check with auto-merge disabled. The backend's own
`CLAUDE.md` authorises this inside a backend task; when it is part of an app release, confirm with
the user as above.

## Dev mobile builds are opt-in

A merge to `dev` does **not** ship an Android/iOS build. Lint, typecheck, tests and the dev web
deploy (dev.recipely.net) still run on every dev push; the Gradle APK and the macOS IPA only run
when the user explicitly asks — never add a marker on your own initiative.

- **Flag the merge commit**: a marker in the **subject line** of the squash-merge commit, i.e. the
  PR title — `[dist]` (both platforms), `[dist:android]`, `[dist:ios]`. Only the first line is
  scanned (`dev-distribution-gate` in `ci.yml`); the body used to be read too, and a commit whose
  body merely explained the markers shipped an IPA nobody wanted. A marker in a body is inert.
- **Or trigger by hand**: `gh workflow run ci.yml --ref dev -f android=true`. The `ios` input
  defaults to **false** — an iOS dev IPA is built only with `-f ios=true`. A manual dispatch may
  target any branch.
- `IOS_CI_ENABLED` (repo variable) is the iOS kill switch — `0` pauses iOS builds even when one is
  requested.

Production (`main`) distribution is unaffected: every push to `main` tags a version and ships to
Play internal + TestFlight.
