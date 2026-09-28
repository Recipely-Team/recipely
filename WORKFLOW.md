# Development Workflow

> **Use the agent team by default, without being asked.** For any non-trivial task, delegate
> to the subagents in `.claude/agents/` (`ts-developer`, `rn-developer`, `test-developer`,
> `ui-designer`, `code-reviewer`). The user has authorized the whole flow — branch → implement →
> gate → `code-reviewer` approval → push → PR to `dev` → merge to `dev` — **without asking**.
> Stop only on failures (lint/tsc/jest/check:structure red, review requests changes, unresolvable
> conflict) or the release-only steps (promoting `dev → main`, production Firebase Hosting deploy),
> which are **stop-and-ask**. The authoritative summary is root `CLAUDE.md` → "Agent workflow (use
> by default)".

The step-by-step procedures live as Claude Code skills in `.claude/skills/`, loaded on demand:

| Step | Skill |
|---|---|
| 1. Branch from `dev`: `feat/<short-description>`, `fix/<short-description>`, `refactor/<short-description>`, `chore/<short-description>` | [`pr-flow`](.claude/skills/pr-flow/SKILL.md) |
| 2. Split the work across agents (UI → `rn-developer`, TS/domain → `ts-developer`, tests → `test-developer`, design → `ui-designer`, review → `code-reviewer`) | `CLAUDE.md` Roster + Token economy |
| 3. Develop — atomic conventional commits | [`pr-flow`](.claude/skills/pr-flow/SKILL.md), [`architecture-rules`](.claude/skills/architecture-rules/SKILL.md) |
| 4. Code review before merge — one diff-scoped `code-reviewer` pass; DDD guardrails (CLAUDE.md §17-20) are blocking | [`.claude/agents/code-reviewer.md`](.claude/agents/code-reviewer.md) |
| 5. Push and open a PR to `dev` | [`pr-flow`](.claude/skills/pr-flow/SKILL.md) |
| 6. Merge to `dev` on green, then sync; delete a stale local branch | [`pr-flow`](.claude/skills/pr-flow/SKILL.md) |
| Bug fix — regression test, guard, `docs/regressions.md` row | [`bug-fix`](.claude/skills/bug-fix/SKILL.md) |
| Anything visual — prototype first | [`design-handoff`](.claude/skills/design-handoff/SKILL.md) |
| A new route | [`new-screen`](.claude/skills/new-screen/SKILL.md) |
| Copy in the 14 locales | [`i18n-copy`](.claude/skills/i18n-copy/SKILL.md) |
| Release `dev → main`, dev APK/IPA builds | [`release`](.claude/skills/release/SKILL.md) |
| Dev database / logs (read-only) | [`dev-db`](.claude/skills/dev-db/SKILL.md) |
| Live E2E against dev | [`live-e2e`](.claude/skills/live-e2e/SKILL.md) |

## Rules

- **Dependency rule**: layers import only inward, never upward.
- **Error handling**: `Result<T, Failure>`, never thrown exceptions.
- **Gates**: `npm run lint`, `npx tsc --noEmit`, `npx jest`, `npm run check:structure` must all be green
  (after `npm run map` when files moved). Web-facing work also builds locally: `npx expo export --platform web`.
- `dev` is the base branch for all work; all PRs go to `dev`; `main` is only for releases.
