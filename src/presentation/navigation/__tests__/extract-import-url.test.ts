import { extractImportUrl } from '@presentation/navigation/extract-import-url';

describe('extractImportUrl', () => {
  it('takes the page a browser shares', () => {
    expect(extractImportUrl(null, 'https://www.nefisyemektarifleri.com/menemen-tarifi/')).toBe(
      'https://www.nefisyemektarifleri.com/menemen-tarifi/',
    );
  });

  it('finds the link inside shared text and leaves the sentence punctuation behind', () => {
    expect(extractImportUrl('Bunu dene (https://example.com/menemen).', null)).toBe('https://example.com/menemen');
  });

  it('sends an Instagram share on canonical', () => {
    expect(extractImportUrl('https://instagr.am/reel/Cx1y2z3/ 🔥', null)).toBe('https://www.instagram.com/reel/Cx1y2z3/');
  });

  // Words with a dot in them are not a host to go and fetch.
  it('does not read plain words as a web address', () => {
    expect(extractImportUrl('Menemen.Tarifi', null)).toBeNull();
  });

  it('ignores a share with nothing importable in it', () => {
    expect(extractImportUrl('https://www.youtube.com/watch?v=x', null)).toBeNull();
  });
});
