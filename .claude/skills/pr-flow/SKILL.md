---
name: pr-flow
description: The Recipely app's end-to-end git flow — branch from dev, run the four gates plus the map, get code-reviewer approval, open a PR to dev, and squash-merge only when CI is green. Use whenever a change in this repo is ready to commit, push, open a PR or merge, or when the user says "ship it", "open a PR", "merge it" or asks to run the gates. Not for promoting dev to main (use the release skill).
---

# PR flow (app repo → `dev`)

The user has authorised this whole flow in `CLAUDE.md`. Do not ask before branching,
committing, pushing, opening a PR or merging **to `dev`**. Stop only on a red gate, a
`code-reviewer` request for changes, a merge conflict you cannot safely resolve, or a
`CLAUDE.md` Exception.

## 1. Branch from `dev`

```bash
git checkout dev && git pull && git checkout -b <feat|fix|refactor|chore>/<name>
# spelled out: git checkout dev; git pull origin dev; git checkout -b <branch-name>
```

Branch names: `feat/<short-description>` (feature), `fix/<short-description>` (bug fix),
`refactor/<short-description>`, `chore/<short-description>` (other).

Never edit `dev` or `main` directly. `main` is release-only; never target it from here.

## 2. Implement

Use the agent pipeline in `CLAUDE.md` (subject to its Token economy rules). Stage and commit regularly (`git add` + `git commit`) in clear,
atomic conventional commits: `feat(scope):`, `fix(scope):`, `refactor(scope):`, `chore(scope):`.
A behavioural bug fix follows the `bug-fix` skill before it is done.

Every commit message ends with the attribution line the session gives, currently:

```
Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
```

Husky runs on every `git commit`: `npx lint-staged` (`eslint --fix` on staged `.ts`/`.tsx`),
`npx tsc --noEmit`, `npm run --silent check:structure`. Emergency bypass is
`git commit --no-verify`, with the reason written in the commit message.

## 3. Gates — all green or the work is not done

```bash
npm run lint
npx tsc --noEmit
npx jest 2>&1 | grep -E '^(Test Suites|Tests):'   # must show no "failed"
npm run map                                        # regenerates PROJECT-MAP.md after adding/moving/deleting files
npm run check:structure
```

- `npx jest` at minimum covers the touched layer; read the `Test Suites:` line, not only the exit code.
- `npm run map` output is committed; `check:structure` rule J blocks on a stale map.
- `check:structure` also runs `assert-crawlable-surface.mjs`, `verify:envelope` and
  `verify:spotlight`; CI runs `check:structure:ci` (without the Swift checks).
- `KNOWN_DEBT` in `scripts/check-structure.mjs` only shrinks; never add to it without user approval.
- For web-facing changes, `npx expo export --platform web` (or `npm run build:web`) is the local build check.

## 4. Review

`code-reviewer` must approve before merge: one pass, diff-scoped (`git diff dev...HEAD`) —
`Agent(subagent_type: "code-reviewer", prompt: "...")`. If it
requests changes, loop back to the developer agent. Never merge over a blocked review.

## 5. Push and open the PR → `dev`

```bash
git push -u origin <branch-name>
gh pr create --base dev --title "<conventional title>" --body "<summary>"
```

The PR body ends with:

```
🤖 Generated with [Claude Code](https://claude.com/claude-code)
```

The PR title becomes the squash-merge subject, and CI scans that subject for the dev
mobile-build markers (see the `release` skill). Put a marker in the title **only** when the
user asked for a dev Android/iOS build.

## 6. Merge only on green

```bash
if gh pr checks <n> --watch --fail-fast; then gh pr merge <n> --squash --delete-branch; fi
git checkout dev && git pull
```

- Right after `gh pr create` the checks may not have registered yet and `gh pr checks` exits
  with "no checks reported". Wait ~30 s and run the same `if … --watch` line again; never merge
  without a green watch.
- A red check: fix, push, and watch again. Do not merge red.
- The plain form is `gh pr merge <pr-number> --squash --delete-branch`; never run it outside the green `if`.
- If a stale local branch remains after the squash merge: `git branch -D <branch-name>`.

## 7. Report

The PR number and the merged commit. Stop.
