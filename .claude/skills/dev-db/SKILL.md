---
name: dev-db
description: Read-only inspection of the Recipely DEV backend — querying the dev Postgres on the dev box (dev-api.recipely.net) over SSH, and reading its container logs. Use when a task needs to check what the dev database actually holds (a user, recipe, device, notification row, counts) or why a dev API call failed. Never for writes, migrations or production.
---

# Dev DB checks (read-only)

The dev backend runs on its own Oracle box, separate from prod.

- SSH alias: `ssh recipely-api-dev` (from `~/.ssh/config`). App dir on the box: `~/recipely-backend-dev`.
- Postgres runs as the `postgres` service of that dir's `docker compose`; credentials come from the
  container's own `POSTGRES_USER` / `POSTGRES_DB`, so none are typed or printed here.

## Query

Write the SQL to a file in the scratchpad, copy it over, run it, delete it. Passing SQL as a file
avoids three layers of shell quoting.

```bash
cat > <scratchpad>/q.sql <<'SQL'
SET default_transaction_read_only = on;
select count(*) from recipes;
SQL
scp -q <scratchpad>/q.sql recipely-api-dev:/tmp/recipely-q.sql
ssh recipely-api-dev "cd ~/recipely-backend-dev && docker compose exec -T postgres sh -c 'psql -q -v ON_ERROR_STOP=1 -U \$POSTGRES_USER -d \$POSTGRES_DB -At' < /tmp/recipely-q.sql; rm -f /tmp/recipely-q.sql"
```

- `\$POSTGRES_USER` / `\$POSTGRES_DB` are escaped so they expand inside the container, not locally.
- Keep the `SET default_transaction_read_only = on;` first line: any write then fails instead of
  changing dev data.
- `-At` gives unaligned, tuples-only output; `-q` hides the `SET` tag.
- Database names are snake_case via Prisma `@map` (model `User` → table `users`, `deletedAt` →
  `deleted_at`); read `prisma/schema.prisma` in `recipely-backend` rather than guessing a name.
- Accounts are soft-deleted: filter `deleted_at is null` when counting live users.

## Logs

```bash
ssh recipely-api-dev "cd ~/recipely-backend-dev && docker compose logs --tail=200 api"
```

## Never

- Print secrets: do not `cat` the box's `.env`, `env`, or `docker compose config`, and do not select
  token, password-hash or key columns. Listing variable NAMES is fine; ask the user for a value.
- Write, migrate, restart or deploy from here. Pushing to the backend's `dev` branch deploys it
  (`.github/workflows/deploy-dev.yml`).
- Touch production (`recipely-api-prod`) with this procedure.
