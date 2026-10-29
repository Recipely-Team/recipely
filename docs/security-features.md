# Security features — what Recipely has, and what a banking app adds next

Mapped to [OWASP MASVS v2](https://mas.owasp.org/MASVS/) control groups (STORAGE, CRYPTO, AUTH,
NETWORK, PLATFORM, CODE, RESILIENCE, PRIVACY). Each "has" row names where it lives, so it can be
shown, not just claimed.

## Already in Recipely

| Feature | MASVS | Where | The point to make |
|---|---|---|---|
| **Forced / optional update, server-enforced** | CODE | backend `app-version-gate-middleware.ts` (426), app `application/app-version/` | The client screen is UX; the server's `426 Upgrade Required` is the gate a patched or old build cannot skip ([MASTG-KNOW-0074](https://mas.owasp.org/MASTG/knowledge/ios/MASVS-PLATFORM/MASTG-KNOW-0074/), [MASWE-0043](https://mas.owasp.org/MASWE/MASVS-CODE/MASWE-0043/)). A pulled release (`blockedVersions`) is blocked even above the minimum. Fails open on a DB blip. |
| **App attestation** (Play Integrity / App Attest) | RESILIENCE | backend `attestation-middleware.ts`, app `infrastructure/integrity/` | Proves the request comes from the genuine, unmodified app on a real device; bound to verb + path + request id, so a proof cannot be replayed on another call. Monitor → enforce rollout behind a flag. |
| **Rotating refresh tokens + reuse detection** | AUTH | backend `RefreshTokenIssuer`, `refresh_tokens.family_id` | A stolen refresh token used twice revokes the whole family. Web keeps it in an HttpOnly cookie, never in JS. |
| **Revoke every session** | AUTH | `users.sessions_valid_after` | Password change / account delete invalidates all JWTs issued before it. Deleted accounts are cut immediately (`EnsureAccountActive`). |
| **Secure token storage** | STORAGE | `SecureTokenStorage` (Keychain / Keystore) | Tokens never in AsyncStorage / plain files. |
| **Encrypted envelope over TLS** | NETWORK | `aes-envelope.ts`, backend `decrypt-body.ts` | Bodies are AES-GCM inside TLS. Honest caveat: the key ships in the bundle, so this is obfuscation against casual proxies, not a secret — the next step is a per-session key (ECDH). |
| **Enumeration-safe auth** | AUTH | forgot-password, resend | Same answer whether or not the email exists. |
| **OTP done right** | AUTH | registration | Hashed codes, 5 attempts, 3-minute TTL, resend lock; since #444 **idempotent** — a retry after a timeout signs in instead of locking the user out; since #446 a 72-hour single-use **magic link**, only its SHA-256 stored. |
| **Rate limits** | AUTH | `rate-limit-middleware.ts` | Per IP for credentials, per user for heartbeats, per key for AI. |
| **Remote kill switches** | CODE | `feature_flags` + `FeatureFlagResolver` | Turn a broken feature off for every client without a release. |
| **Request ids end to end** | CODE | `X-Request-Id` → server log + Crashlytics breadcrumb | Forensics: one id finds the call on both sides. |
| **Secret scanning in the commit hook** | CODE | `guard-secrets.mjs` | A key never reaches git. |
| **PII scrubbing in logs** | PRIVACY | `scrubLoggedRequest` | Bodies and auth headers never logged. |
| **Account deletion, ATT, UMP consent** | PRIVACY | tombstone delete, ATT prompt | Store-compliant privacy. |

## Next — ranked by value for effort

1. **Maintenance / service-status banner** (CODE) — the same server-decides pattern as the version
   check: `GET /app/status` → `normal | degraded | maintenance` with a message; maintenance blocks
   like `updateRequired`. Reuses the gate, the store and the screen. *Small.*
2. **Screen privacy** (PLATFORM) — `FLAG_SECURE` / iOS snapshot overlay on sensitive screens
   (password, profile, payment-like data) and a blurred app-switcher preview. `expo-screen-capture`. *Small.*
3. **Biometric app lock + step-up auth** (AUTH) — Face ID / fingerprint to open the app after N
   minutes in background, and again before destructive actions (delete account, change email or
   password). `expo-local-authentication`; the unlock key lives in Keychain with
   `kSecAccessControlBiometryCurrentSet`, so new fingerprints invalidate it. *Medium.*
4. **Session timeouts** (AUTH) — idle timeout (e.g. 5 min in banking) and an absolute session cap,
   enforced by the server (refresh-token family age), not only the client. *Small.*
5. **Certificate / public-key pinning** (NETWORK) — pin the SPKI of the API's issuing CA plus a backup
   key, with a remote-config escape hatch to rotate. Needs a native module → native build. *Medium.*
6. **New-device sign-in alert + active sessions list** (AUTH) — email "new sign-in from iPhone,
   Istanbul" with a "this wasn't me" link that revokes the family; a Settings screen listing devices
   with "sign out everywhere". The `devices` table already records logins. *Medium.*
7. **Root / jailbreak / hooking signals** (RESILIENCE) — read Play Integrity's
   `deviceIntegrity` / App Attest risk metric (already received) and decide per route: block money-like
   actions on a compromised device, allow reading. *Small on top of attestation.*
8. **Breached-password check** (AUTH) — HIBP k-anonymity range API on register / change password. *Small.*
9. **Passkeys** (AUTH) — WebAuthn / platform passkeys as the primary sign-in; phishing-resistant MFA. *Large.*
10. **Web hardening** — turn on a real CSP (helmet runs with `contentSecurityPolicy: false`), HSTS
    preload, and reCAPTCHA Enterprise / App Check for the web, which cannot attest. *Medium.*
11. **Supply chain** — Dependabot + `npm audit` gate + CodeQL in CI, SBOM per release. *Small.*

## Banking-specific concepts worth naming in an interview

- **Defence in depth**: client checks are UX; the server is the authority (the 426 gate is the example).
- **Fail open vs fail closed**: availability features (version check, flags) fail open; security
  checks (attestation in enforce mode, authorisation) fail closed. Say which and why.
- **Idempotency**: every retried write (verify, payment) must be safe to replay — the #444 incident is
  a real example: one-time token consumed before the response was delivered.
- **Transaction signing / WYSIWYS**: the amount and payee shown are what the server signs, confirmed
  with biometrics bound to a device key.
- **Server-driven config**: version policy, flags, maintenance and pins are all remote, so a
  vulnerability is answered in minutes, not a store review.
