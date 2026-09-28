---
name: bug-fix
description: The Recipely regression discipline (CLAUDE.md rule 24) — reproduce, minimal fix, a regression test named after the symptom that fails without the fix, a mechanical guard where one is possible, and a docs/regressions.md row. Use whenever fixing wrong behaviour a user or tester reported, a crash, or a bug found in review, in the app repo. Skip for typos and copy tweaks.
---

# Bug fix (rule 24)

A bug fix is not finished at the fix. It ships the test that would have caught it, so the four
gates — lint, `tsc`, `jest`, `check:structure` — find the next one BEFORE anyone takes a build.

Pipeline: `ts-developer` or `rn-developer` (reproduce → minimal fix → regression test → guard +
`docs/regressions.md` row) → `code-reviewer`. Collapse into the lead when context is in hand
(Token economy). Then the `pr-flow` skill.

## Steps, in order

1. **Reproduce** and find the root cause, not the nearest symptom.
2. **Write the regression test first.** It must FAIL against the unfixed code — run it before the
   fix and see it fail. A test that passes either way documents nothing.
   - Name it after the SYMPTOM the user saw ("an ingredient row split 'yumurta' across the badge
     and the name"), not the mechanism.
   - Say in a comment what was wrong; the next reader is deciding whether they may change that line.
3. **Minimal fix.** Then the test passes.
4. **Ask whether a gate could have caught it.** Prefer, in this order:
   - a `check:structure` rule in `scripts/check-structure.mjs` (mechanical, catches it in every
     future file; add a letter to the header list and cite the `CLAUDE.md` rule it backs);
   - a coding standard in `CLAUDE.md` (short) with its rationale under the matching
     `### Rule N` heading in `architecture.md`;
   - a type that makes the state unrepresentable.
   Not everything qualifies — a race condition does not become a lint rule.
5. **Record the CLASS, not the incident**, in `docs/regressions.md`: under the fitting `## Area`
   heading, a bold one-line symptom, a short paragraph of root cause, then `*Guard:*` naming the
   test / rule / type that now prevents a recurrence. Keep it short enough to read in one sitting;
   write it in English (rule 26).

## Proportionality

A typo or a copy tweak needs none of this. A wrong behaviour a user reported needs at least step 2.
`code-reviewer` blocks a behavioural fix that arrives without a test that fails without it.
