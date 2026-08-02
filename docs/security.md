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

## What is deployed

Measured after the work, not planned before it.

| hostname | Cloudflare | protection |
|---|---|---|
| `api.recipely.net` | **DNS only** | authentication + authorisation. `/admin` returns 404 here. |
| `admin.recipely.net` | Proxied | Cloudflare Access (email code) → AdminJS password → rate limit |
| `dev-api.recipely.net` | Proxied | `/admin` behind Access; the API routes are open by decision |
| `dev.recipely.net` | Proxied | Access on the whole hostname |

**`api.recipely.net` is direct on purpose, and that closes off a defence.**
Cloudflare's origin timeout is 100 s, fixed on Free/Pro/Business, while the
Instagram import measures ~119 s — proxying it returns 524 on long imports. The
cost of going direct is that the origin cannot be firewalled to Cloudflare
ranges, because real users connect to it. That is a deliberate trade, not an
oversight. The way out, if it ever matters, is making the import asynchronous
(POST → job id → poll) so no request runs longer than 100 s.

**The admin panel is the part worth protecting**, and it has four independent
layers now. When this work started it had one: a password, guessable without
limit, over a plain-HTTP port open to the internet.

- **Origin CA certificate**, valid to 2041. Let's Encrypt could not be used:
  Access intercepts the HTTP-01 challenge, so every renewal would fail and the
  panel would go dark 90 days later. The private key was generated on the box
  and has never left it — Cloudflare signed a CSR and never saw the key.
- **Zone-level Authenticated Origin Pulls** with our own CA. Global AOP was the
  first step, but the certificate Cloudflare presents there is shared across all
  its customers: it proves a request came *through Cloudflare*, not through
  *this account*. Zone-level closes that. Verified: a direct request to the
  origin answers `400 No required SSL certificate was sent`.
- **Access**, then the panel's own password, then 10 attempts per 15 minutes.

**No Access service token is used.** An earlier version of this document planned
one, on the assumption the whole dev API would sit behind Access. It does not —
only `/admin` does — so the client code that sent those headers was removed
rather than left to imply a protection that was not there.

### DNS

The zone moved to Cloudflare. `recipely.net` and `api.recipely.net` are DNS-only;
`admin`, `dev` and `dev-api` are proxied. There is no MX record and no `www`, so
the migration could not break mail. nginx configuration for the boxes lives in
the backend repo under `deploy/nginx/`, pulled back off the host after the
change rather than written as an intention.

## Build-time checks

`npm run check:secrets` fails a release build carrying a placeholder secret.
`API_AES_KEY_HEX` falls back to 64 zeros when `EXPO_PUBLIC_API_AES_KEY` is
unset — nothing errors, the app simply encrypts every request with a key an
attacker guesses in one try. It runs in both production distribution jobs, and
is deliberately a no-op for `APP_VARIANT=development`.

## Open items

- **Certificate pinning** is NOT implemented, deliberately. `api.recipely.net`
  uses Let's Encrypt, which rotates the leaf roughly every 60 days: pinning it
  breaks the app for every user on that cycle, pinning the intermediate breaks
  when Let's Encrypt rotates one, and pinning the root ties the app to that CA
  for good. Recovery from a bad pin needs a store release — days on iOS, with
  the app unusable throughout. Against that, the attacker it stops is one who
  can already disable the pin on a device they control. If it is ever done, the
  safe shape is the root SPKI plus a backup pin plus a remote kill switch.
- **Attestation** (Play Integrity / App Attest) is the real answer to "only my
  app may call this" and is not built. It needs a Google Cloud service account
  with the Play Integrity API enabled and an Apple App Attest key before the
  client side is worth writing, and the verdict must be verified server-side —
  never trusted from the client.
- **The AES envelope** still ships its key in the binary. See above: it adds
  nothing over TLS, and a key exchange would not change that.
