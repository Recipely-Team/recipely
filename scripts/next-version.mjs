/**
 * The version the `tag-release` job in ci.yml stamps next, from the last tag
 * and the commit log since it.
 *
 * - **Same rule as ci.yml's `bump` step:** a breaking change (`type!:` or
 *   `BREAKING CHANGE`) bumps major, a `feat` bumps minor, anything else bumps
 *   patch. The `[major]`/`[minor]`/`[patch]` overrides live on the release
 *   merge commit, which does not exist yet when this runs.
 * - **Kept apart from generate-changelog.mjs** so it can be tested without
 *   writing CHANGELOG.md.
 */
const BREAKING = /^[a-z]+(\([^)]*\))?!:|BREAKING CHANGE/m;
const FEATURE = /^feat(\([^)]*\))?:/m;

/** @param {number[]} version `[major, minor, patch]` of the last tag. @param {string} log subjects and bodies since it. */
export const nextVersion = ([major, minor, patch], log) => {
  if (BREAKING.test(log)) return [major + 1, 0, 0];
  if (FEATURE.test(log)) return [major, minor + 1, 0];
  return [major, minor, patch + 1];
};
