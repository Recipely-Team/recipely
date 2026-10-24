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

## Certificate pinning

Release builds pin `api.recipely.net` to the four ISRG (Let's Encrypt) root
keys — Android `<pin-set>`, iOS `NSPinnedDomains`, written by
`plugins/withApiCertificatePinning.js` (#580). Pinning the roots, not the leaf,
survives every renewal; moving the API to another CA needs a release with the
new pin first, and `npm run verify:pins` checks the live chain. Android's pins
expire on the plugin's `PIN_EXPIRATION` (fail open); move it with each release.
`dev-api` is not pinned — Cloudflare rotates its CAs. As OWASP says above, this
slows interception on a device someone else controls; it stops nothing on a
device the attacker owns.

## Attestation

What answers "this request came from our genuine app on a genuine device":
Play Integrity on Android, App Attest on iOS, via `@expo/app-integrity`.
Code: `src/infrastructure/integrity/`. Behind the `appAttestation` flag, **Off**.

**Which requests.** Only `ATTESTED_ROUTES` (`infrastructure/constants/api/attested-routes.ts`):
sign-up, AI generation and refinement, imports, fridge scan and ideas, meal
photo parsing, voice-assistant sessions. Play Integrity is metered per day and
these are the routes that cost money or mint accounts.

**The binding.** Every proof is over `METHOD path\nX-Request-Id` (`requestBinding`),
where `path` is the route relative to `/api/v1` with no query string — Express's
`req.path` inside the v1 router (`POST /recipes/generate`), not `originalUrl`.
The backend rebuilds the string from the request it received, so a proof cannot
be moved onto another call, and remembering accepted request ids stops a replay.

**Headers.**

| header | Android | iOS |
|---|---|---|
| `X-App-Attestation-Platform` | `android` | `ios` |
| `X-App-Attestation` | Play Integrity token, `requestHash` = SHA-256 hex of the binding | App Attest assertion (base64), `clientDataHash` = SHA-256 of the binding |
| `X-App-Attestation-Key` | — | the registered key id |

**iOS key registration, once per install.** `GET /attestation/challenge` →
`{ challenge }`; the app generates a Secure Enclave key, Apple attests it over
SHA-256 of the challenge, and `POST /attestation/apple-key`
`{ keyId, attestation, challenge }` registers it. The key id is stored only after
the backend accepted it; an assertion failing with "invalid key" (restored backup,
reinstall) forgets it and the next request registers a new one.

**On iOS the counter stops replays.** An assertion carries no timestamp, so the
backend requires its counter to strictly rise (Apple's rule), checked and stored
atomically; the remembered request id covers Android, whose token is dated. An
assertion overtaken by a later one is refused too — attested routes are single
user actions, never fired in parallel.

**Fail open on the client.** No proof (unsupported device, Play services
missing, an outage, or slower than `ATTESTATION_TIMEOUT_MS`) means the request goes without the headers. The backend
decides: log-only first, then refuse on the attested routes once the numbers
say real users are not caught.

**Development keeps working on simulators, emulators and the web.** None of them
can attest, and none is blocked:

| runtime | what the app sends | why |
|---|---|---|
| web (any browser, `npm run web`) | no headers | `createAppAttestor` has no attestor for the web; the native module is never called |
| iOS Simulator | no headers, at once | App Attest reports `isSupported = false` |
| Android Emulator | no headers, or a low-integrity token | Play services missing fails fast; otherwise the verdict lacks device integrity. Bounded at 3 s either way |

The backend only refuses in `enforce`, and refuses to **boot** in `enforce` unless it
serves the production app (`NODE_ENV=production`, the store package and bundle id,
production App Attest keys). Dev servers stay on `monitor`, so a request without a
proof is logged, never refused, and the web app passes on its rate limits.

**Before turning the flag on:**

1. Backend verifies both platforms (recipely-backend `docs/roadmap.md`).
2. Android: link the Google Cloud project in Play Console → App integrity, enable
   the Play Integrity API, and set the repo variable `PLAY_INTEGRITY_PROJECT_NUMBER`
   (read by the distribute jobs as `EXPO_PUBLIC_PLAY_INTEGRITY_PROJECT_NUMBER`).
3. iOS — **done 2026-10-24**: App Attest is enabled on `net.recipely.app` and
   `net.recipely.app.dev`, both App Store profiles were regenerated with it and
   uploaded to CI, and `app.json` carries
   `com.apple.developer.devicecheck.appattest-environment` = `production` (a test
   keeps it there). TestFlight and App Store builds use Apple's production
   environment; the share extension does not need it. Any future profile must
   keep the capability, or CI signing fails.
4. Flip `appAttestation` to DevOnly, verify against dev, then On.

## Open items

- **Attestation** — the app half is built (below); the backend half, which is
  the half that protects anything, is on recipely-backend's `docs/roadmap.md`.
- **The AES envelope** still ships its key in the binary. See above: it adds
  nothing over TLS, and a key exchange would not change that.
