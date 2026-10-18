---
name: import-failures
description: Find out why a recipe import (Instagram, TikTok, YouTube, Facebook, Pinterest, web page) failed for a user on PRODUCTION — list recent failed import jobs with their server-side diagnostic, look one up by job id, and tell an app-side problem from a backend/worker one. Use when a user or the team reports "import doesn't work", "some imports failed", or an import error message shown in the app. Read-only.
---

# Import failures (prod, read-only)

Imports run entirely on the backend: the app enqueues `POST /api/v1/recipes/import`, then polls
`GET /api/v1/recipes/import/jobs/:id` until it is `done` or `failed`. A failed job carries an `errorKey`
the app translates — that key is all the app ever sees. The real cause is stored server-side.

## Get the failures

The tooling lives in the backend repo, a sibling of this one (`../recipely-backend`):

```bash
../recipely-backend/scripts/import-failures.sh --summary                 # counts per error_key, last 3 days
../recipely-backend/scripts/import-failures.sh --since '6 hours' --limit 20
../recipely-backend/scripts/import-failures.sh --id <jobId>               # one job, full error_detail
```

The full triage guide — worker logs, cause → fix table — is
`../recipely-backend/.claude/skills/import-failures/SKILL.md`. Read it before diagnosing.

## App side or backend side?

- The job row exists and is `failed` with an `error_detail` → backend/worker problem. Fix it in
  `recipely-backend` (its bug flow), not here.
- The job is `done` but the user saw an error → app problem: polling, the draft screen, or the
  `errorKey` → copy mapping.
- No job row at all for that time → the enqueue request never succeeded: the app's request, auth, or
  the URL validator (`errors.import.invalid_url` / `not_instagram` come back synchronously, no job).
- The app crashed → there is no backend trace; check Crashlytics.

An `errorKey` the app shows as a raw dotted key means the app's catalogue lacks it — that one is an app fix.
