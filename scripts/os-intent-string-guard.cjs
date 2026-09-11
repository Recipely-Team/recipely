/**
 * Finds user-visible strings in App Intents Swift that would reach the user in
 * English on every phone.
 *
 * WHY it lives apart from the generator: the generator writes files when it is
 * imported, so a test could not load it without rewriting the tree. This is the
 * part with an opinion, and it has a table-driven test of its own
 * (`scripts/__tests__/os-intent-string-guard.test.js`).
 *
 * WHY a positive rule first: listing bare forms one by one missed some
 * (`IntentDescription = "…"`, a `LocalizedStringResource` with no table, a typo
 * in the table's name). Requiring EVERY `LocalizedStringResource("…")` to name
 * the table closes all of those at once; the bare-literal list below covers
 * the initialisers that take a plain string instead.
 *
 * Data is not copy: a string that is exactly one interpolation — a recipe's
 * own name, `"\(title)"` — passes. Text around an interpolation does not.
 * Comment lines are skipped so a doc block may quote what it forbids.
 */
const TABLE = 'RecipelyIntents';

/** A Swift string literal that is one interpolation and nothing else. */
const PURE_INTERPOLATION = String.raw`"\\\([^()"]*\)"`;

const BARE_FORMS = [
  ['requestValueDialog', String.raw`requestValueDialog:\s*"`],
  ['IntentDialog literal', String.raw`IntentDialog\(\s*"`],
  ['IntentDialog(stringLiteral:) literal', String.raw`IntentDialog\(stringLiteral:\s*"`],
  ['dialog:', String.raw`\bdialog:\s*(?!${PURE_INTERPOLATION})"`],
  ['shorthand = "…"', String.raw`:\s*(?:LocalizedStringResource|IntentDescription|TypeDisplayRepresentation|DisplayRepresentation)\s*=\s*"`],
  ['IntentDescription("…")', String.raw`IntentDescription\(\s*"`],
  ['shortTitle:', String.raw`\bshortTitle:\s*"`],
  ['TypeDisplayRepresentation(name:)', String.raw`TypeDisplayRepresentation\(\s*name:\s*"`],
  ['title:', String.raw`\btitle:\s*(?!${PURE_INTERPOLATION})"`],
  ['subtitle:', String.raw`\bsubtitle:\s*(?!${PURE_INTERPOLATION})"`],
  ['description:', String.raw`\bdescription:\s*"`],
  ['needsValueError("…")', String.raw`needsValueError\(\s*"`],
  ['requestValue("…")', String.raw`requestValue\(\s*"`],
  ['String(localized:)', String.raw`String\(\s*localized:\s*"`],
].map(([form, source]) => [form, new RegExp(source)]);

/** Every `LocalizedStringResource("…" …)` call, with whatever follows the key. */
const RESOURCE_CALL = /LocalizedStringResource\(\s*"(?:[^"\\]|\\.)*"([^)]*)\)/g;

const CASE_BLOCK = /caseDisplayRepresentations[^=]*=\s*\[([\s\S]*?)\]/g;

const withoutComments = (code) =>
  code
    .split('\n')
    .filter((line) => !line.trimStart().startsWith('//'))
    .join('\n');

/**
 * @param {string} source Swift source
 * @returns {{ form: string, snippet: string } | null} the first offence, or null
 */
function findBareString(source) {
  const code = withoutComments(source);

  for (const match of code.matchAll(RESOURCE_CALL)) {
    const table = /table:\s*"([^"]*)"/.exec(match[1]);
    if (table === null || table[1] !== TABLE) {
      return { form: `LocalizedStringResource without table: "${TABLE}"`, snippet: match[0] };
    }
  }

  for (const [form, pattern] of BARE_FORMS) {
    const hit = pattern.exec(code);
    if (hit !== null) return { form, snippet: hit[0] };
  }

  for (const block of code.matchAll(CASE_BLOCK)) {
    if (/:\s*"/.test(block[1])) return { form: 'caseDisplayRepresentations literal', snippet: block[0].slice(0, 80) };
  }

  return null;
}

module.exports = { findBareString, TABLE };
