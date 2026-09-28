---
name: live-e2e
description: Running the gated live end-to-end specs in the sibling recipely-tests repo (Playwright) against the DEV stack — the real-model AI recipe creation spec (RECIPELY_AI_E2E=1) and the voice assistant's live decisions (RECIPELY_ASSISTANT_E2E=1). Use when a change to AI generation, publishing, the assistant prompt or its action list needs proving against a real backend and model, or when the user asks for live/E2E tests.
---

# Live E2E (recipely-tests)

`/Users/recep/Documents/GitHub/recipely-tests` is a separate repo (Playwright + Maestro). Its defaults
target **production** (`helpers/config.ts`); point it at dev explicitly. It reads a local `.env`
(`.env.example` lists the keys), where the real `RECIPELY_API_AES_KEY` and the E2E account
(`RECIPELY_TEST_EMAIL` / `RECIPELY_TEST_PASSWORD`) live. Never print that file; process env wins over it.

## Dev targets

- API: `RECIPELY_API_URL=https://dev-api.recipely.net`
- Web: `RECIPELY_WEB_URL=https://app-recipely-dev.web.app` — `dev.recipely.net` sits behind
  Cloudflare Access and answers a 302 to its login, which a Playwright browser cannot pass.

## The gated specs (each costs real model calls and money)

AI recipe creation — generate → publish blocked without a photo → add photo → publish → backend
check of the stored image URL → owner-API cleanup. Runs once, on `desktop-chromium` only:

```bash
cd /Users/recep/Documents/GitHub/recipely-tests
RECIPELY_WEB_URL=https://app-recipely-dev.web.app RECIPELY_API_URL=https://dev-api.recipely.net \
RECIPELY_AI_E2E=1 npx playwright test tests/web/ai-create.spec.ts --project=desktop-chromium
```

Voice assistant `live decisions` — which action the model picks for real user sentences. Run it when
the assistant prompt or action list changes:

```bash
RECIPELY_API_URL=https://dev-api.recipely.net RECIPELY_ASSISTANT_E2E=1 \
npx playwright test tests/backend/assistant.spec.ts --project=backend-direct
```

Both also need a real AES key and the test account; without them they skip with a stated reason
(`CAN_RUN_AUTHED` in `helpers/auth.ts`) — a skip is not a pass, so read the summary.

## Other runs

`npm run test:backend`, `npm run test:web`, `npm run test:mobile`, `npm test` (everything, gated specs
skipped), `npm run report` (last HTML report), `npm run maestro:ios` / `maestro:android` (native flows,
see `maestro/README.md`).

## Rules

- Do not run it while another agent is using recipely-tests, and do not edit that repo from an app
  task; a change there is its own PR in that repo.
- A live failure that shows an app bug goes through the `bug-fix` skill here (a unit/regression test
  in this repo), not only a fix to the spec.
