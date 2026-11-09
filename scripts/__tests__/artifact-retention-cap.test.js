/**
 * Every artifact a workflow uploads expires within a week.
 *
 * The org's free Actions storage is 0.5 GB. The production web build (~6 MB)
 * and IPA (~30 MB) were kept 30 days, so a month of releases held ~465 MB and
 * GitHub mailed "100% of Actions storage used" (2026-11-09). Nothing downloads
 * these artifacts later — Firebase Hosting, TestFlight and Firebase App
 * Distribution hold the shipped copies — so they only need to outlive a flaky
 * upload step. An upload step without `retention-days` gets the repo default
 * (90 days), so a missing value fails here too.
 *
 * `artifact-cleanup.yml` is the second half: it deletes all but the newest
 * copy of each artifact daily, so even a burst of builds cannot fill the quota.
 */
const fs = require('node:fs');
const path = require('node:path');

const WORKFLOWS = path.join(__dirname, '..', '..', '.github', 'workflows');
const MAX_RETENTION_DAYS = 7;
const UPLOAD = /^(\s*)(?:- )?uses:\s*actions\/upload-artifact@/;

/** Each upload step as { file, line, days }, days null when not set. */
const uploadSteps = () =>
  fs
    .readdirSync(WORKFLOWS)
    .filter((f) => /\.ya?ml$/.test(f))
    .flatMap((file) => {
      const lines = fs.readFileSync(path.join(WORKFLOWS, file), 'utf8').split('\n');
      return lines.flatMap((text, i) => {
        if (!UPLOAD.test(text)) return [];
        let days = null;
        for (let j = i + 1; j < lines.length && !/^\s*- /.test(lines[j]); j++) {
          const m = /^\s*retention-days:\s*(\d+)/.exec(lines[j]);
          if (m) days = Number(m[1]);
        }
        return [{ file, line: i + 1, days }];
      });
    });

describe('workflow artifacts', () => {
  it('finds the upload steps (the scan is not testing nothing)', () => {
    expect(uploadSteps().length).toBeGreaterThan(0);
  });

  it(`each expires within ${MAX_RETENTION_DAYS} days`, () => {
    const offenders = uploadSteps()
      .filter((s) => s.days === null || s.days > MAX_RETENTION_DAYS)
      .map((s) => `${s.file}:${s.line} retention-days=${s.days ?? 'unset (90)'}`);
    expect(offenders).toEqual([]);
  });

  it('the daily cleanup workflow exists', () => {
    expect(fs.existsSync(path.join(WORKFLOWS, 'artifact-cleanup.yml'))).toBe(true);
  });
});
