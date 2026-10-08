/**
 * CHANGELOG.md heads unreleased work with the version CI will stamp.
 *
 * Reported with the minor-bump fix in ci.yml (#552): `generate-changelog.mjs`
 * always headed pending commits with the last tag patch-bumped, so a release
 * full of features was announced as `1.1.16` while CI tagged it `1.2.0`. The
 * script now asks `next-version.mjs`, which follows ci.yml's rule; this runs
 * the real script against scratch repositories and reads the heading back.
 */
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { execFileSync } = require('node:child_process');

const SCRIPT = path.join(__dirname, '..', 'generate-changelog.mjs');

/** Runs a command, rethrowing flat so jest-worker can report it. */
const run = (cwd, file, args) => {
  try {
    return execFileSync(file, args, { cwd, stdio: 'pipe' }).toString().trim();
  } catch (failure) {
    throw new Error(`${file} ${args[0]} failed: ${String(failure.stderr ?? failure.message)}`);
  }
};

/** The changelog's "unreleased" heading after `messages` land on top of v1.1.15. */
const unreleasedHeading = (messages) => {
  const cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'changelog-'));
  try {
    run(cwd, 'git', ['init', '-q']);
    run(cwd, 'git', ['config', 'user.email', 'ci@example.com']);
    run(cwd, 'git', ['config', 'user.name', 'CI']);
    run(cwd, 'git', ['commit', '-q', '--allow-empty', '-m', 'chore: base']);
    run(cwd, 'git', ['tag', 'v1.1.15']);
    for (const message of messages) run(cwd, 'git', ['commit', '-q', '--allow-empty', '-m', message]);
    run(cwd, 'node', [SCRIPT, '--quiet']);
    return fs.readFileSync(path.join(cwd, 'CHANGELOG.md'), 'utf8').split('\n').find((line) => line.includes('unreleased'));
  } finally {
    fs.rmSync(cwd, { recursive: true, force: true });
  }
};

describe('changelog: the unreleased version matches what CI will tag', () => {
  it('heads a release with a feature as a minor bump', () => {
    expect(unreleasedHeading(['fix(ui): a fix (#1)', 'feat(ui): a feature (#2)'])).toBe('## 1.2.0 — unreleased');
  });

  it('heads fixes only as a patch bump', () => {
    expect(unreleasedHeading(['fix(ui): a fix (#1)', 'refactor: tidy (#2)'])).toBe('## 1.1.16 — unreleased');
  });

  it('heads a breaking change as a major bump, from a subject or a body', () => {
    expect(unreleasedHeading(['feat(api)!: drop v1 (#1)'])).toBe('## 2.0.0 — unreleased');
    expect(unreleasedHeading(['refactor: rename\n\nBREAKING CHANGE: the old name is gone'])).toBe('## 2.0.0 — unreleased');
  });
});
