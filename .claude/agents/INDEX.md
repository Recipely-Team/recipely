# Agent Team — Recipely (mobile/web app)

Subagents for this project. Each `*.md` file (except this one) is a Claude Code subagent with YAML
frontmatter — auto-discovered. Each preloads the project skills it needs through the `skills:`
frontmatter field, so it does not have to read `CLAUDE.md` or `architecture.md` for procedures.

**The lead works inline by default.** Use these only for large, genuinely parallel work, and ask the
user before any multi-agent effort (`CLAUDE.md` token budget B1–B6).

## Roster

| Agent | When to invoke | Preloaded skills |
|-------|----------------|------------------|
| **ts-developer** | `domain` / `application` / `infrastructure` / `core` — entities, value objects, use cases, repositories, DTOs, mappers, DI, type-level modeling. | architecture-rules, bug-fix, pr-flow, i18n-copy, dev-db |
| **rn-developer** | `src/presentation/` UI — screens, widgets, expo-router routes, themed components, custom hooks. | architecture-rules, design-handoff, new-screen, i18n-copy, bug-fix, pr-flow |
| **test-developer** | New harnesses or large suites — use cases, repositories, mappers, stores, value objects, presentation hooks. | bug-fix, live-e2e |
| **ui-designer** | A genuinely new visual surface: Claude Design prototype first, then `src/presentation/design-spec.md`. No production code. | design-handoff |
| **code-reviewer** | Final read-only, diff-scoped audit before merge — layering, TS strictness, the mandatory coding standards. Blocks on any violation. | architecture-rules, pr-flow, bug-fix |

## Pipelines

**Feature**: (Claude Design, then `ui-designer` if it has a visual surface — rule 28) → `ts-developer` and/or `rn-developer` → `test-developer` → `code-reviewer` → compare the built screen with the prototype
**Bug fix**: `ts-developer` or `rn-developer` (reproduce → minimal fix → regression test → guard + `docs/regressions.md` row) → `code-reviewer`

Run agents in parallel when their files don't overlap.

## Branch strategy

- `dev` (integration) → `main` (release only)
- Feature branches off `dev`: `feat/<name>`, `fix/<name>`, `refactor/<name>`, `chore/<name>`
- Never commit directly to `main` or `dev`
- All PRs target `dev` and require **code-reviewer** approval before merge (`pr-flow` skill)
- Promoting `dev → main` and production (Firebase Hosting) web deploys are **release decisions — stop and ask** (`release` skill)

## Project ground rules (every agent must obey)

- DDD / Clean Architecture inward deps: `presentation` / `infrastructure` → `application` → `domain` → `core`
- Business logic returns `Result<T, Failure>` — never throws in domain / application code
- The mandatory coding standards in root `CLAUDE.md` (rules 1–28) are blocking; their full text is under
  `### Rule N` in `architecture.md`, located through the `architecture-rules` skill
- **DDD guardrails** (CLAUDE.md §17-20 + `architecture.md` §DDD Guardrails) are blocking: ports + DI, no
  new `KNOWN_DEBT`; no `.tsx` over 300 lines and routed `index.tsx` composition-only; rich entities with
  private ctor + `create(): Result`; new entities in the Aggregates table, cross-aggregate refs by id
- Quality gate before merge: `npm run lint`, `npx tsc --noEmit`, `npx jest`, `npm run check:structure` all green
