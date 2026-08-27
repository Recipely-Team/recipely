import { resolveTaxonomyKey } from '@presentation/base/hooks/assistant/args/resolve-taxonomy-key';

/** The live cuisine strip, as it renders on the feed. */
const CUISINES = [
  ['turkish', 'Türk'], ['italian', 'İtalyan'], ['mexican', 'Meksika'], ['chinese', 'Çin'],
  ['japanese', 'Japon'], ['indian', 'Hint'], ['french', 'Fransız'], ['greek', 'Yunan'],
  ['middle_eastern', 'Orta Doğu'], ['central_asian', 'Orta Asya'], ['mediterranean', 'Akdeniz'],
].map(([key, name]) => ({ key: key as string, name: name as string }));

/**
 * "Türk mutfağını filtreye ekle" — the assistant answered that it had tried and
 * could not find it, with the Türk chip on screen beside the sentence. Folding
 * had fixed the LETTERS; it had not fixed the fact that a person says more
 * words than the label carries. The taxonomy is named "Türk"; nobody says that
 * on its own.
 */
describe('resolveTaxonomyKey', () => {
  it('finds a cuisine named inside the phrase the user actually says', () => {
    expect(resolveTaxonomyKey(CUISINES, 'Türk mutfağı')).toBe('turkish');
    expect(resolveTaxonomyKey(CUISINES, 'türk yemekleri')).toBe('turkish');
    expect(resolveTaxonomyKey(CUISINES, 'İtalyan mutfağı')).toBe('italian');
  });

  // The transcriber pads an utterance with whatever the room was doing:
  // "Türk mutfağı. Giysinler." was a real one, and the whole thing was rejected.
  it('survives noise the transcriber turned into words', () => {
    expect(resolveTaxonomyKey(CUISINES, 'Türk mutfağı. Giysinler.')).toBe('turkish');
  });

  it('still takes a bare name and a machine key', () => {
    expect(resolveTaxonomyKey(CUISINES, 'Türk')).toBe('turkish');
    expect(resolveTaxonomyKey(CUISINES, 'turkish')).toBe('turkish');
  });

  // Both contain "Orta". A shorter match would answer either one.
  it('keeps Orta Doğu and Orta Asya apart by preferring the longest match', () => {
    expect(resolveTaxonomyKey(CUISINES, 'Orta Doğu mutfağı')).toBe('middle_eastern');
    expect(resolveTaxonomyKey(CUISINES, 'Orta Asya yemekleri')).toBe('central_asian');
  });

  it('matches whole words only, so Çin does not answer for Hindiçini', () => {
    expect(resolveTaxonomyKey(CUISINES, 'Hindiçini')).toBeNull();
  });

  it('declines rather than guessing when two cuisines are equally present', () => {
    expect(resolveTaxonomyKey(CUISINES, 'Çin ve Hint arasında karar veremedim')).toBeNull();
  });

  it('declines what is not there at all', () => {
    expect(resolveTaxonomyKey(CUISINES, 'İsveç mutfağı')).toBeNull();
  });
});
