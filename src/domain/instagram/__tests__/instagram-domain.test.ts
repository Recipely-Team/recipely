import { DmKeywords } from '@domain/instagram/dm/dm-keywords';
import { DmRuleDraft } from '@domain/instagram/dm/dm-rule-draft';
import { readInstagramReturn } from '@domain/instagram/connect/read-instagram-return';
import { readReturnQuery } from '@domain/instagram/connect/read-return-query';
import { InstagramReturnKind } from '@domain/instagram/connect/instagram-return-kind';

const keywordsOf = (...words: string[]): DmKeywords => DmKeywords.of(words);

describe('DmKeywords', () => {
  it('lower-cases, trims, collapses spaces and ignores a repeat', () => {
    const k = keywordsOf('  Tarif  Lütfen ', 'tarif lütfen', 'RECIPE');
    expect(k.value).toEqual(['tarif lütfen', 'recipe']);
  });

  it('refuses an empty, a 41-character and an eleventh word', () => {
    expect(DmKeywords.empty().with('   ').ok).toBe(false);
    expect(DmKeywords.empty().with('x'.repeat(41)).ok).toBe(false);
    const ten = keywordsOf(...Array.from({ length: 10 }, (_, i) => `w${i}`));
    expect(ten.isFull).toBe(true);
    expect(ten.with('eleven').ok).toBe(false);
  });

  it('matches a comment that contains a word, folding Turkish case', () => {
    expect(keywordsOf('tarif').matchIn('TARİF lütfen 🙏', 'tr')).toBe('tarif');
    expect(keywordsOf('tarif').matchIn('çok güzel', 'tr')).toBeNull();
  });
});

describe('DmRuleDraft', () => {
  const valid = { mediaId: 'm1', keywords: keywordsOf('tarif'), recipeId: 'r1', dmText: 'Hi {name}! {link}', publicReplyText: null };

  it('accepts a complete rule and trims its texts', () => {
    const r = DmRuleDraft.validate({ ...valid, publicReplyText: ' Sent 👌 ' });
    expect(r.ok && [r.value.keywords, r.value.publicReplyText]).toEqual([['tarif'], 'Sent 👌']);
  });

  it('refuses a missing post, no keyword, no recipe, a DM without {link} or past 900, and an empty or long public reply', () => {
    expect(DmRuleDraft.validate({ ...valid, mediaId: null }).ok).toBe(false);
    expect(DmRuleDraft.validate({ ...valid, keywords: DmKeywords.empty() }).ok).toBe(false);
    expect(DmRuleDraft.validate({ ...valid, recipeId: null }).ok).toBe(false);
    expect(DmRuleDraft.validate({ ...valid, dmText: 'Hi {name}' }).ok).toBe(false);
    expect(DmRuleDraft.validate({ ...valid, dmText: `{link}${'x'.repeat(900)}` }).ok).toBe(false);
    expect(DmRuleDraft.validate({ ...valid, publicReplyText: '  ' }).ok).toBe(false);
    expect(DmRuleDraft.validate({ ...valid, publicReplyText: 'x'.repeat(301) }).ok).toBe(false);
  });
});

describe('the Instagram return link', () => {
  it('reads an authorized return as its one-time code', () => {
    const r = readInstagramReturn(readReturnQuery('recipely://instagram-connected?status=authorized&code=abc%2B1'));
    expect(r).toEqual({ kind: InstagramReturnKind.Authorized, code: 'abc+1' });
  });

  it('reads a refusal as denied, and anything else — an error, no code, junk — as failed', () => {
    expect(readInstagramReturn(readReturnQuery('x://y?status=error&reason=denied')).kind).toBe(InstagramReturnKind.Denied);
    expect(readInstagramReturn(readReturnQuery('x://y?status=error&reason=failed')).kind).toBe(InstagramReturnKind.Failed);
    expect(readInstagramReturn(readReturnQuery('x://y?status=authorized')).kind).toBe(InstagramReturnKind.Failed);
    expect(readInstagramReturn(readReturnQuery('x://y')).kind).toBe(InstagramReturnKind.Failed);
  });
});
