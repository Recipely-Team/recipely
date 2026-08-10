import { FailureCode } from '@core/failure/failure-code';
import { DiagnosticMessage } from '@core/failure/diagnostic-message';

/**
 * These vocabularies exist so one word is written down once. That only holds
 * while the entries stay distinct: two members sharing a value is not a
 * compile error — the union simply collapses and two states, codes or failures
 * become indistinguishable at runtime while still reading as separate names.
 *
 * The catalogue additionally has to stay usable as a diagnostic: an empty
 * sentence in a log or a crash report tells the next reader nothing.
 */

const leaves = (node: unknown, path: string[] = []): [string, unknown][] =>
  typeof node === 'object' && node !== null
    ? Object.entries(node).flatMap(([k, v]) => leaves(v, [...path, k]))
    : [[path.join('.'), node]];

describe('FailureCode', () => {
  it('has no two members sharing a value', () => {
    const values = Object.values(FailureCode);

    expect(new Set(values).size).toBe(values.length);
  });
});

describe('DiagnosticMessage', () => {
  const entries = leaves(DiagnosticMessage);

  it('is not empty', () => {
    expect(entries.length).toBeGreaterThan(0);
  });

  it('has no blank sentence', () => {
    const blank = entries.filter(([, v]) => typeof v === 'string' && v.trim().length === 0);

    expect(blank).toEqual([]);
  });

  it('never gives two different failures the same wording', () => {
    // A duplicate makes two distinct failures read identically in a log, which
    // is the one job these strings have.
    const sentences = entries.filter(([, v]) => typeof v === 'string').map(([, v]) => v as string);
    const seen = new Set<string>();
    const duplicates = sentences.filter((s) => (seen.has(s) ? true : (seen.add(s), false)));

    expect(duplicates).toEqual([]);
  });

  it('builds an interpolated message from the value it is given', () => {
    expect(DiagnosticMessage.crypto.badIvLength(12)).toContain('12');
    expect(DiagnosticMessage.network.uploadFailed(503)).toContain('503');
  });
});
