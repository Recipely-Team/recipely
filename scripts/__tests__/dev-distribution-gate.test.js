/**
 * The gate that decides whether a dev merge ships a mobile build, run for real.
 *
 * Reported as "CI failed" on a merge that asked for no build at all. The step
 * took the commit's subject line with
 * `printf '%s' "$COMMIT_MESSAGE" | head -n 1`, and `head` closes the pipe as
 * soon as it has its line: once a squash message grew past what the pipe
 * buffer holds, `printf` was still writing, took EPIPE, and `set -o pipefail`
 * failed the step. Nothing about the change was wrong — the commit message was
 * merely long, which is not a thing CI may have an opinion about.
 *
 * Reading a workflow could not have caught that: both halves were individually
 * correct and only their interaction at a certain SIZE was wrong. So this
 * extracts the step's real script out of `ci.yml` and runs it in bash, the way
 * the runner does. A rewrite that reintroduces a pipe fails here.
 */
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { execFileSync } = require('node:child_process');

const WORKFLOW = path.join(__dirname, '..', '..', '.github', 'workflows', 'ci.yml');

/**
 * The `run:` body of the step with `id: decide`, dedented.
 *
 * Located by its step id rather than by line number so moving the job around
 * the file does not silently turn this suite into a test of nothing.
 */
const gateScript = () => {
  const lines = fs.readFileSync(WORKFLOW, 'utf8').split('\n');
  const idAt = lines.findIndex((line) => line.trim() === 'id: decide');
  if (idAt === -1) throw new Error('ci.yml has no step with `id: decide`');

  const runAt = lines.findIndex((line, i) => i > idAt && line.trim() === 'run: |');
  if (runAt === -1) throw new Error('the `decide` step has no `run: |` block');

  const body = [];
  const indent = /^(\s*)/.exec(lines[runAt + 1])[1];
  for (const line of lines.slice(runAt + 1)) {
    if (line.trim() !== '' && !line.startsWith(indent)) break;
    body.push(line.slice(indent.length));
  }
  return body.join('\n');
};

/**
 * The gate script with its comment lines removed.
 *
 * A comment is inert, and the step's own comments quote the very expression
 * being banned in order to explain why — matching against them flags the fix
 * as the bug.
 */
const gateCode = () =>
  gateScript()
    .split('\n')
    .filter((line) => !line.trimStart().startsWith('#'))
    .join('\n');

/**
 * Runs the step as the runner would, with GitHub's two output files staged.
 *
 * `github.event_name` reaches the script as a literal `${{ }}` substitution, so
 * it is replaced here the same way the runner would before execution.
 */
const decide = (commitMessage, eventName = 'push') => {
  const outputs = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'dist-gate-')), 'out');
  fs.writeFileSync(outputs, '');
  const summary = `${outputs}.summary`;
  fs.writeFileSync(summary, '');

  const script = gateScript().replace(/\$\{\{ github\.event_name \}\}/g, eventName);

  try {
    execFileSync('bash', ['-e', '-c', script], {
      env: {
        ...process.env,
        COMMIT_MESSAGE: commitMessage,
        INPUT_ANDROID: 'false',
        INPUT_IOS: 'false',
        GITHUB_OUTPUT: outputs,
        GITHUB_STEP_SUMMARY: summary,
      },
      stdio: 'pipe',
    });
  } catch (failure) {
    // Rethrown flat, and this matters: Node's execFileSync error carries a
    // self-referencing `error` property, and jest-worker serializes a thrown
    // value to JSON to reach the parent process. Letting the original escape
    // killed the whole suite with "Converting circular structure to JSON" and
    // printed nothing about the actual failure.
    const status = failure.status === undefined ? '?' : String(failure.status);
    const stderr = failure.stderr === undefined ? '' : String(failure.stderr);
    throw new Error(`the gate script exited ${status}: ${stderr || failure.message}`);
  }

  return fs.readFileSync(outputs, 'utf8').trim().split('\n').sort().join(' ');
};

/**
 * Past Linux's 64 KB pipe buffer, under Linux's 128 KB limit on one env var.
 *
 * Both bounds are real and they nearly meet. The bug needs a message larger
 * than the pipe buffer; the ceiling is `MAX_ARG_STRLEN`, which caps a SINGLE
 * environment variable (or argv string) at 128 KB whatever `ARG_MAX` says
 * about the total — a 400 KB message here made `execve` fail with E2BIG on the
 * runner while passing on macOS, which has no per-string cap. That is a test
 * green locally and red in CI for a reason unrelated to what it tests.
 *
 * macOS buffers far more than 128 KB before a writer sees EPIPE, so no size
 * that fits in an env var reproduces the failure there. This assertion
 * therefore only BITES on Linux — which is where the gate runs, and the only
 * place the bug ever occurred. The structural assertion below is what holds
 * on a developer's machine.
 */
const longBody = 'x'.repeat(100000);

describe('dev distribution gate', () => {
  it('never sends the commit message through a pipe', () => {
    // The hazard itself, named: `head` closes the pipe as soon as it has its
    // line, so any reader put on the end of `$COMMIT_MESSAGE` fails the step
    // for messages over the buffer size and passes for everything smaller.
    // Platform-independent, unlike the size test below, so this is the half
    // that bites while editing on a Mac.
    expect(gateCode()).not.toMatch(/\$COMMIT_MESSAGE"?\s*\|/);
  });

  it('survives a commit message longer than a pipe buffer', () => {
    // The reported failure, exactly: an ordinary merge whose message is long.
    expect(decide(`fix(recipes): an ordinary subject (#418)\n\n${longBody}`)).toBe(
      'android=false ios=false',
    );
  });

  it('still ships nothing for an unmarked merge', () => {
    expect(decide('fix(web): something (#1)\n\nbody')).toBe('android=false ios=false');
  });

  it('ships both when the subject carries [dist]', () => {
    expect(decide('feat(x): ship it [dist] (#2)\n\nbody')).toBe('android=true ios=true');
  });

  it('ships one platform when the subject names it', () => {
    expect(decide('feat(x): ship it [dist:android] (#3)')).toBe('android=true ios=false');
    expect(decide('feat(x): ship it [dist:ios] (#4)')).toBe('android=false ios=true');
  });

  it('leaves a marker in the BODY inert', () => {
    // The older bug this step already carries a comment about: a commit that
    // merely explained what the markers do shipped an IPA nobody wanted.
    expect(decide('fix(y): clean subject (#5)\n\nthis body mentions [dist] and must not count')).toBe(
      'android=false ios=false',
    );
  });

  it('handles a message with no body at all', () => {
    expect(decide('chore: no newline anywhere')).toBe('android=false ios=false');
  });

  it('takes a manual dispatch at its word', () => {
    // The subject is irrelevant on a dispatch; the inputs decide.
    expect(decide('feat(x): [dist] in the subject (#6)', 'workflow_dispatch')).toBe(
      'android=false ios=false',
    );
  });
});
