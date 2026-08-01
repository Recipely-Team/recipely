# Security

What this app can and cannot protect, and how the dev environment is closed.

## What cannot be hidden, and why not pretending otherwise matters

**The API host is not a secret and cannot be made one.** Three independent
reasons, none of which has a workaround:

1. The app must connect to the server, so the address is on the device.
2. The TLS handshake sends the hostname in plaintext (SNI) *before* encryption
   begins, and the DNS lookup says the same thing. A packet capture is enough —
   the app never has to be touched.
3. The bundle is readable. An APK or IPA unzips, and the JS bundle is text.

**`EXPO_PUBLIC_*` values are not secrets either.** Expo inlines them into the
bundle at build time; [their own documentation](https://docs.expo.dev/guides/environment-variables/)
says these "will be visible in plain-text in your compiled application". A
`.env` file keeps a value out of git — not out of the binary.

This matters because effort spent hiding the host is effort not spent on the
boundary that actually holds. **The security boundary is the backend.** The
question worth answering is not "can someone find the URL" but "what can
someone do who knows it". If the answer is "nothing they are not authorised
to", the URL being public costs nothing.

OWASP puts the same point about pinning: it is a resilience control that slows
interception, not a control that prevents it — a determined tester on a rooted
device will bypass it. Useful, but if defeating the pin reveals an API with
broken authorisation, the pinning was cosmetic.

## The AES envelope, honestly

`/api/v1` requests travel inside an AES-256-GCM envelope keyed by
`API_AES_KEY_HEX`, which ships **inside the binary**. Encryption protects
nothing from someone holding the key, so the envelope's real value is limited
to a passive network observer — which TLS already covers.

A key exchange (ECDH or similar) does not change this. It encrypts the channel,
but it does not authenticate *who* is on the other end: the handshake code is in
the app, so anyone who can extract a static key can equally reimplement the
handshake. The one genuine gain is forward secrecy — a leaked key no longer
decrypts recorded traffic.

What actually answers "only my real app may call this" is **platform
attestation**: Play Integrity on Android, App Attest on iOS. These produce a
token signed by Google or Apple that the server verifies, and they cannot be
forged by reimplementing client code. `expo-app-integrity` exposes both. The
rule that makes or breaks it: **verify on the server, never trust the client's
own verdict.**

## Dev environment

`dev.recipely.net` and `dev-api.recipely.net` are closed with **Cloudflare
Access**, so the dev database is not writable by the open internet.

- **People** (dev site, and browser access to the dev API) authenticate with an
  email one-time code. No client software, any device.
- **The dev app** cannot complete an email login, so it authenticates with an
  Access **service token** — two headers checked at the edge
  (`CF-Access-Client-Id` / `CF-Access-Client-Secret`), supplied to the build via
  `EXPO_PUBLIC_CF_ACCESS_*` and attached in `build-common-headers.ts`.

Those header values are in the dev bundle and are therefore readable by anyone
holding the dev APK. That is accepted: the goal is that the open internet cannot
reach the dev database, not that a holder of an unreleased build cannot.
Production sends no Access headers — `api.recipely.net` is public by design and
is protected by authentication and authorisation.

### DNS migration (one-time, done by hand)

Cloudflare Access requires the hostname to be proxied through Cloudflare, which
requires the zone's nameservers to point there. Record the current state first —
this is the whole zone as of the migration:

| Name | Type | Value | Proxy |
|---|---|---|---|
| `recipely.net` | A | `199.36.158.100` (Firebase Hosting) | DNS only |
| `recipely.net` | TXT | `hosting-site=app-recipely` | — |
| `dev` | CNAME | `app-recipely-dev.web.app` | **Proxied** |
| `dev-api` | A | `140.238.216.129` (Oracle dev) | **Proxied** |
| `api` | A | `144.24.239.155` (Oracle prod) | DNS only |

There is **no MX record and no `www`** — the domain carries no mail, so the
migration cannot break email.

1. Add `recipely.net` to Cloudflare, let it import, then **compare against the
   table above** and add anything missing before switching nameservers.
2. Change nameservers at Namecheap to the pair Cloudflare gives.
3. Set SSL/TLS mode to **Full (strict)** before proxying anything — Flexible
   would talk plain HTTP to the origin.
4. Leave `recipely.net` and `api` **DNS only**. Only `dev` and `dev-api` get the
   orange cloud; production keeps its current path and certificates.
5. Zero Trust → Access → add an application per protected hostname, with a
   policy allowing the two team email addresses.
6. For `dev-api`, add a **service token** and a second policy accepting it, so
   the app is not asked to log in.

Firebase Hosting already holds a valid certificate for `dev.recipely.net`;
proxying after that is issued is what makes Full (strict) work. If the
certificate ever needs reissuing, grey-cloud the record first.

## Build-time checks

`npm run check:secrets` fails a release build carrying a placeholder secret.
`API_AES_KEY_HEX` falls back to 64 zeros when `EXPO_PUBLIC_API_AES_KEY` is
unset — nothing errors, the app simply encrypts every request with a key an
attacker guesses in one try. It runs in both production distribution jobs, and
is deliberately a no-op for `APP_VARIANT=development`.

## Open items

- **CORS is `origin: true, credentials: true`** on the backend, which reflects
  any origin. It should be an allowlist of the app's own web origins.
- **No certificate pinning.** Worth adding as a speed bump, with the caveat that
  a pin outliving its certificate takes the app down for everyone — it needs a
  backup pin and a rotation plan before it is safe to ship.
- **Attestation** (Play Integrity / App Attest) is the answer to "only my app
  may call this", and needs a backend verification endpoint before the client
  side is worth writing.
