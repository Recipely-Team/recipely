---
name: architecture-rules
description: Where the full Recipely architecture rules and their rationale live, by kind of code — layer boundaries, DDD guardrails (ports, rich domain, aggregates), entity/value-object/use-case/repository/mapper/store conventions, constants and design tokens, responsive sizing, presentation structure. Use when writing, restructuring or reviewing code in src/ (domain, application, infrastructure, core or presentation) and the terse CLAUDE.md rule is not enough to decide.
---

# Architecture rules — read only the section the change needs

`CLAUDE.md` states rules 1–28 in short. `architecture.md` holds the depth: its own numbered
**Coding Standards** sections, and **CLAUDE.md rule rationale** (`## CLAUDE.md rule rationale`,
one `### Rule N` heading per `CLAUDE.md` rule, full text with the incidents behind it). Open the
section with `grep -n '<heading>' architecture.md` and read that section, not the whole file.
`PROJECT-MAP.md` says where a new file goes.

## By kind of change

| You are touching | Read in `architecture.md` |
|---|---|
| Any import across layers | `## Layer Overview`, `### Dependency Rule`; `### Rule 15`, `### Rule 17` |
| A new infrastructure capability (storage, notifications, audio, …) | `### Ports, not direct infrastructure`; `### Rule 17` |
| An entity or value object | `### OOP & rich domain model`, `### Aggregates`, `### src/domain/`; `### Rule 19`, `### Rule 20`, `### Rule 21` |
| A use case or Zustand store | `### src/application/`, `### 1. One Declaration Per File`, `### 13a. Feature Folders…`; `### Rule 1`, `### Rule 12` |
| A repository, DTO, mapper, HTTP call | `### src/infrastructure/`; `### Rule 23c2`, `### Rule 23d`, `### Rule 21` |
| `src/core/` primitives, `Result`, `Failure` | `### src/core/`, `### 12. Error Handling`; `### Rule 5` (`DiagnosticMessage`) |
| Constants / a literal | `### 5. Constants — No Magic Values…` (all its subsections); `### Rule 5` |
| Styles, sizes, tokens, layout widths | `### 5a. Design Tokens & Responsive Sizing`, `### 6. React Native — Styles`; `### Rule 6b`, `### Rule 6b2`, `### Rule 6c` |
| A screen, widget, hook or page folder | `### src/presentation/`, `### 7.`–`### 10.`; `### Rule 14`, `### Rule 18`, `### Rule 23`, `### Rule 23b` |
| Folder layout / a folder growing | `#### 4a. Folders must stay scannable`, `### 13a.`; `### Rule 14b`, `### Rule 14c` |
| Doc comments | `### 3. JSDoc…`; `### Rule 3` |
| Logging | `### Rule 22` |
| Ads, crawlable routes, analytics names | `### Rule 23e`, `### Rule 23f`, `### Rule 25` (and the `new-screen` skill) |
| Assistant code / `@live-assistant/*` | `### Rule 27` |
| Tests | `### 13. Testing` |
| Gate output you do not understand | `## Pre-Commit Quality Gate`, `### Rule 16`, and the header of `scripts/check-structure.mjs` (one letter per rule) |
| The backend contract (hosts, envelope) | `## Backend` |

## Before handing off

Gates via the `pr-flow` skill. A business rule found in UI moves down a layer in the same PR
(rule 18). A new entity adds its Aggregates-table row (rule 20).
