/**
 * No secret reaches git: no env file or copy of one, no key file, no credential in a file's text.
 *
 * 2026-10-04 a `.env.bak.<timestamp>` copy of a real backend `.env` was committed with
 * `git add -A` and promoted to main, because `.gitignore` named `.env` but not its copies.
 * Ignore rules miss copies, renames and new formats, so this checks what is actually going in.
 *
 * - `--staged` (pre-commit): the files this commit adds or changes, read from the index.
 * - no flag (CI, check:structure): every tracked file.
 *
 * Usage: node scripts/guard-secrets.mjs [--staged]
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const staged = process.argv.includes('--staged');
const git = (args) => execFileSync('git', args, { encoding: 'utf8', maxBuffer: 256 * 1024 * 1024 });

const FORBIDDEN_NAMES = [
  { test: (f) => /(^|\/)\.env(\.|$)/.test(f) && path.basename(f) !== '.env.example', why: 'env file (only .env.example is committed)' },
  { test: (f) => /\.(bak|backup|orig)(\.|$)/i.test(path.basename(f)), why: 'backup copy' },
  { test: (f) => /\.(pem|key|p8|p12|pfx|jks|keystore|mobileprovision)$/i.test(f), why: 'key / certificate / signing file' },
  { test: (f) => /(^|\/)(google-services\.json|GoogleService-Info\.plist)$/.test(f), why: 'Firebase config (kept local, injected in CI)' },
  { test: (f) => /service[-_]?account.*\.json$/i.test(f), why: 'service-account credentials' },
  { test: (f) => /(^|\/)id_(rsa|ed25519|ecdsa)(\.pub)?$/.test(f), why: 'SSH key' },
];

const SECRET_TEXT = [
  { re: /-----BEGIN [A-Z ]*PRIVATE KEY-----/, why: 'private key block' },
  { re: /AIza[0-9A-Za-z_-]{35}/, why: 'Google API key' },
  { re: /\b(ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9]{36}\b|\bgithub_pat_[A-Za-z0-9_]{60,}/, why: 'GitHub token' },
  { re: /\bAKIA[0-9A-Z]{16}\b/, why: 'AWS access key' },
  { re: /\bsk-(proj-|ant-)?[A-Za-z0-9_-]{32,}/, why: 'OpenAI / Anthropic API key' },
  { re: /\bxox[abprs]-[A-Za-z0-9-]{10,}/, why: 'Slack token' },
  { re: /\bgsk_[A-Za-z0-9]{40,}/, why: 'Groq API key' },
];

const files = (staged
  ? git(['diff', '--cached', '--name-only', '--diff-filter=ACMR', '-z'])
  : git(['ls-files', '-z'])
).split('\0').filter(Boolean);

const textOf = (file) => {
  try {
    const buf = staged
      ? execFileSync('git', ['show', `:${file}`], { maxBuffer: 256 * 1024 * 1024, stdio: ['ignore', 'pipe', 'ignore'] })
      : fs.readFileSync(file);
    return buf.includes(0) ? null : buf.toString('utf8');
  } catch {
    return null;
  }
};

const problems = [];
for (const file of files) {
  const name = FORBIDDEN_NAMES.find((rule) => rule.test(file));
  if (name) {
    problems.push(`${file}: ${name.why}`);
    continue;
  }
  const text = textOf(file);
  if (text === null) continue;
  const hit = SECRET_TEXT.find((rule) => rule.re.test(text));
  if (hit) problems.push(`${file}: looks like it contains a ${hit.why}`);
}

if (problems.length > 0) {
  console.error(`guard-secrets — ${String(problems.length)} file(s) must not be committed:\n`);
  for (const p of problems) console.error(`  ${p}`);
  console.error(`\n${staged ? 'Unstage them (git restore --staged <file>)' : 'Untrack them (git rm --cached <file>)'} and keep secrets in .env / CI secrets.`);
  process.exit(1);
}
console.log(`guard-secrets — OK (${String(files.length)} ${staged ? 'staged' : 'tracked'} file(s))`);
