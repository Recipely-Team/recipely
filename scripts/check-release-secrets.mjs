#!/usr/bin/env node
/**
 * Refuses to build a release artifact with a placeholder or missing secret.
 *
 * Why this exists: `API_AES_KEY_HEX` falls back to 64 zeros when
 * `EXPO_PUBLIC_API_AES_KEY` is unset. That is a sensible default for a local
 * run — and a silent disaster in a shipped build, because nothing fails, the
 * app simply encrypts every request with a key an attacker can guess in one
 * try. A missing Google client id is the same shape: sign-in stops working for
 * every user and the build gives no sign of it.
 *
 * Runs only for release builds. `APP_VARIANT=development` and local work are
 * deliberately allowed to use the defaults.
 */

const PLACEHOLDER_AES_KEY = '0'.repeat(64);
const AES_KEY_LENGTH = 64;

/** Secrets a shipped build cannot be correct without. */
const REQUIRED = [
  {
    name: 'EXPO_PUBLIC_API_AES_KEY',
    why: 'requests would be encrypted with a key of 64 zeros',
    check: (v) =>
      v === PLACEHOLDER_AES_KEY
        ? 'is the all-zero placeholder'
        : v.length !== AES_KEY_LENGTH
          ? `is ${v.length} chars, expected ${AES_KEY_LENGTH} hex chars`
          : /^[0-9a-f]+$/i.test(v)
            ? null
            : 'is not hexadecimal',
  },
  {
    name: 'EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID',
    why: 'Google sign-in would fail for every user',
    check: () => null,
  },
];

const isRelease = process.env.APP_VARIANT !== 'development';

if (!isRelease) {
  console.log('check:secrets — development variant, defaults allowed');
  process.exit(0);
}

const problems = [];
for (const { name, why, check } of REQUIRED) {
  const value = process.env[name] ?? '';
  if (value.length === 0) {
    problems.push(`${name} is not set — ${why}`);
    continue;
  }
  const problem = check(value);
  if (problem !== null) {
    problems.push(`${name} ${problem} — ${why}`);
  }
}

if (problems.length > 0) {
  console.error(`check:secrets — ${problems.length} problem(s):\n`);
  for (const p of problems) console.error(`  · ${p}`);
  console.error('\nSet them in the build environment (EAS secrets / CI secrets).');
  process.exit(1);
}

console.log('check:secrets — OK');
