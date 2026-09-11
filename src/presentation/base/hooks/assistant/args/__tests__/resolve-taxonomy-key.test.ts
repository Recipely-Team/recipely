import { resolveTaxonomyKey } from '@presentation/base/hooks/assistant/args/resolving/resolve-taxonomy-key';

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

/**
 * A dense SAMPLE of names, not the app's list.
 *
 * The cuisines are served by the backend and read from the taxonomy store;
 * nothing here or in production hard-codes them, and `resolveTaxonomyKey` never
 * sees a list it did not receive as an argument. This fixture exists because a
 * matcher that looks INSIDE a phrase carries one risk — a name answering for
 * another — and that risk only appears when the list is crowded. A snapshot of
 * a crowded list is the cheapest way to hold the matcher to it; if the backend
 * adds a cuisine that collides, the honest place to catch it is here.
 */
describe('every cuisine on the strip', () => {
  const NAMES = [
    'Türk', 'İtalyan', 'Meksika', 'Çin', 'Japon', 'Hint', 'Fransız', 'Yunan', 'Amerikan',
    'Akdeniz', 'Tayland', 'İspanyol', 'Kore', 'Orta Doğu', 'Alman', 'İngiliz', 'Vietnam',
    'Lübnan', 'Fas', 'Brezilya', 'Rus', 'İran', 'Karayip', 'Filipin', 'Endonezya', 'Pakistan',
    'Kafkas', 'Afrika', 'Gürcü', 'Azerbaycan', 'Ermeni', 'Özbek', 'Orta Asya', 'Suriye',
    'Mısır', 'Tunus', 'Balkan', 'Portekiz', 'Polonya', 'İsveç', 'Malezya', 'Peru',
    'Arjantin', 'Diğer',
  ];
  const ALL = NAMES.map((name, at) => ({ key: `cuisine-${at}`, name }));

  it.each(ALL)('resolves $name to itself, bare', ({ key, name }) => {
    expect(resolveTaxonomyKey(ALL, name)).toBe(key);
  });

  it.each(ALL)('resolves $name to itself inside a sentence', ({ key, name }) => {
    expect(resolveTaxonomyKey(ALL, `${name} mutfağını filtreye ekle`)).toBe(key);
  });
});

/**
 * The taxonomy is served by the backend. Nothing in the app decides what a
 * cuisine is, and the assistant must not either — a cuisine added on the server
 * has to be filterable by voice the day it appears, without a release.
 */
describe('a cuisine the app has never heard of', () => {
  it('resolves from the list the store supplies, with no local catalogue entry', () => {
    const fromBackend = [
      { key: 'uygur', name: 'Uygur' },
      { key: 'sicilian', name: 'Sicilya' },
    ];

    expect(resolveTaxonomyKey(fromBackend, 'Uygur mutfağı')).toBe('uygur');
    expect(resolveTaxonomyKey(fromBackend, 'Sicilya yemekleri')).toBe('sicilian');
  });

  it('takes the list as an argument and holds no list of its own', () => {
    // The same word against two different backend lists gives two answers,
    // which is only possible if nothing here is hard-coded.
    expect(resolveTaxonomyKey([{ key: 'a', name: 'Türk' }], 'Türk')).toBe('a');
    expect(resolveTaxonomyKey([{ key: 'b', name: 'Türk' }], 'Türk')).toBe('b');
    expect(resolveTaxonomyKey([], 'Türk')).toBeNull();
  });
});

/**
 * Reported from the settings screen: "tema paletinden kırmızı dediğimde yok
 * diyo, İngilizce adları sayıyor sonra bana." The swatch says "Kırmızı Kor",
 * and the user says the word that tells it from the others.
 */
describe('a word the user reads off the screen', () => {
  const palettes = [
    { key: 'pearl', name: 'İnci Beyazı' },
    { key: 'crimson', name: 'Kırmızı Kor' },
    { key: 'emerald', name: 'Zümrüt Bahçe' },
    { key: 'royal', name: 'Kraliyet Moru' },
  ];

  it('finds the palette whose name holds that word', () => {
    expect(resolveTaxonomyKey(palettes, 'kırmızı')).toBe('crimson');
    expect(resolveTaxonomyKey(palettes, 'zümrüt')).toBe('emerald');
  });

  it('still prefers the whole name when it is given', () => {
    expect(resolveTaxonomyKey(palettes, 'Kraliyet Moru yap')).toBe('royal');
  });

  // Two palettes with the same word in them is a question, not an answer.
  it('refuses a word two options share', () => {
    expect(
      resolveTaxonomyKey(
        [
          { key: 'crimson', name: 'Kırmızı Kor' },
          { key: 'rose', name: 'Kırmızı Gül' },
        ],
        'kırmızı',
      ),
    ).toBeNull();
  });
});

/**
 * The model calls `sort` with no argument, or `palette=` with nothing after
 * it, and the value reaching the resolver is an empty string. Every name holds
 * an empty word, and `indexOf` never advances past the end for one: the search
 * below used to spin forever on the JS thread — a frozen app, with no bound and
 * no answer.
 */
describe('an argument with nothing in it', () => {
  const palettes = [
    { key: 'pearl', name: 'İnci Beyazı' },
    { key: 'crimson', name: 'Kırmızı Kor' },
  ];

  it('answers null instead of searching for nothing', () => {
    expect(resolveTaxonomyKey(palettes, '')).toBeNull();
    expect(resolveTaxonomyKey(palettes, '   ')).toBeNull();
  });

  // "j" is not "Japon": a letter or two must sit in a name whole.
  it('does not let one letter pick an option', () => {
    expect(resolveTaxonomyKey([{ key: 'japanese', name: 'Japon' }], 'j')).toBeNull();
    expect(resolveTaxonomyKey([{ key: 'japanese', name: 'Japon' }], 'japon')).toBe('japanese');
  });
});

