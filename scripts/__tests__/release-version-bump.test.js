/**
 * The release step that picks the next version tag, run for real.
 *
 * Reported as "we shipped new features but only the patch went up": v1.1.15
 * carried three `feat` commits and was tagged as a patch. The step tested the
 * commit log with `echo "$log" | grep -qE '^feat…'`. `grep -q` exits at its
 * first match; once the log since the last tag outgrew the pipe buffer, `echo`
 * was still writing, died of SIGPIPE, and `set -o pipefail` turned the whole
 * condition false — silently, inside an `if`, so the step went green and fell
 * through to `patch`. The more a release contained, the surer it was to be
 * called a patch.
 *
 * Same class as `dev-distribution-gate.test.js`: only the SIZE of the input is
 * wrong, so this extracts the step's script from `ci.yml` (by `id: bump`) and
 * runs it in bash against a scratch repository whose log is far past the
 * buffer, plus a platform-independent check that no variable is piped into an
 * early-exiting reader anywhere in the workflow.
 */
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { execFileSync } = require('node:child_process');

const WORKFLOW = path.join(__dirname, '..', '..', '.github', 'workflows', 'ci.yml');

/** The `run:` body of the step with the given id, dedented. */
const stepScript = (id) => {
  const lines = fs.readFileSync(WORKFLOW, 'utf8').split('\n');
  const idAt = lines.findIndex((line) => line.trim() === `id: ${id}`);
  if (idAt === -1) throw new Error(`ci.yml has no step with \`id: ${id}\``);

  const runAt = lines.findIndex((line, i) => i > idAt && line.trim() === 'run: |');
  if (runAt === -1) throw new Error(`the \`${id}\` step has no \`run: |\` block`);

  const body = [];
  const indent = /^(\s*)/.exec(lines[runAt + 1])[1];
  for (const line of lines.slice(runAt + 1)) {
    if (line.trim() !== '' && !line.startsWith(indent)) break;
    body.push(line.slice(indent.length));
  }
  return body.join('\n');
};

/** Every non-comment line of every `run:` block in the workflow. */
const workflowCode = () =>
  fs
    .readFileSync(WORKFLOW, 'utf8')
    .split('\n')
    .filter((line) => !line.trimStart().startsWith('#'))
    .join('\n');

/**
 * Runs git, rethrowing flat: execFileSync's error is circular and kills
 * jest-worker's JSON hand-off, hiding the real failure.
 */
const git = (cwd, args, input) => {
  try {
    return execFileSync('git', args, { cwd, input, stdio: 'pipe' }).toString().trim();
  } catch (failure) {
    throw new Error(`git ${args[0]} failed: ${String(failure.stderr ?? failure.message)}`);
  }
};

/**
 * A body big enough that the log since the tag is far past any platform's pipe.
 * Fed through stdin: Linux caps one argv string at 128 KB (E2BIG).
 */
const LONG_BODY = 'x'.repeat(200000);

/**
 * A repo tagged `v1.1.14` with the given commit subjects on top (oldest first),
 * a bare `origin` to push the new tag to, and the step run in it.
 */
const nextTag = (subjects) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'bump-'));
  const origin = path.join(root, 'origin.git');
  const repo = path.join(root, 'repo');
  git(root, ['init', '-q', '--bare', origin]);
  git(root, ['init', '-q', repo]);
  git(repo, ['config', 'user.name', 'test']);
  git(repo, ['config', 'user.email', 'test@example.com']);
  git(repo, ['commit', '-q', '--allow-empty', '-m', 'chore: base']);
  git(repo, ['tag', '-a', 'v1.1.14', '-m', 'v1.1.14']);
  git(repo, ['remote', 'add', 'origin', origin]);
  for (const subject of subjects) {
    git(repo, ['commit', '-q', '--allow-empty', '-F', '-'], `${subject}\n\n${LONG_BODY}`);
  }

  const outputs = path.join(root, 'out');
  fs.writeFileSync(outputs, '');
  try {
    execFileSync('bash', ['-e', '-c', stepScript('bump')], {
      cwd: repo,
      env: { ...process.env, GITHUB_OUTPUT: outputs },
      stdio: 'pipe',
    });
  } catch (failure) {
    // Rethrown flat: execFileSync's error is circular and kills jest-worker's JSON hand-off.
    const status = failure.status === undefined ? '?' : String(failure.status);
    const stderr = failure.stderr === undefined ? '' : String(failure.stderr);
    throw new Error(`the bump script exited ${status}: ${stderr || failure.message}`);
  }
  return /^tag=(.*)$/m.exec(fs.readFileSync(outputs, 'utf8'))[1];
};

describe('release version bump', () => {
  it('never pipes a variable into a reader that exits early', () => {
    // `grep -q` and `head` close the pipe on their first hit; under pipefail the
    // writer's SIGPIPE fails the pipeline once the text outgrows the buffer.
    expect(workflowCode()).not.toMatch(/(echo|printf)\s[^|\n]*"\$\w+"\s*\|\s*(grep -q|head)/);
  });

  it('bumps minor when a long release contains a feat', () => {
    // The reported release, in shape: features merged after plenty of fixes.
    expect(nextTag(['fix: one', 'refactor: two', 'feat(recipes): cooking mode (#535)', 'fix: three'])).toBe(
      'v1.2.0',
    );
  });

  it('bumps patch when there is no feat', () => {
    expect(nextTag(['fix: one', 'chore: two'])).toBe('v1.1.15');
  });

  it('bumps major for a breaking change', () => {
    expect(nextTag(['feat: one', 'refactor(api)!: drop v1 routes'])).toBe('v2.0.0');
  });

  it('lets the release subject override the commits', () => {
    expect(nextTag(['feat: one', 'Merge release [patch]'])).toBe('v1.1.15');
  });
});
