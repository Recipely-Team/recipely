import { ImageCredit } from '@domain/recipes/media/image-credit';

const URL = 'https://commons.wikimedia.org/wiki/File:Menemen.jpg';

describe('ImageCredit', () => {
  it('keeps author, licence and link, trimmed', () => {
    const credit = ImageCredit.create('  Jane Doe ', ' CC-BY-4.0', ` ${URL} `);
    expect(credit.ok && [credit.value.author, credit.value.license, credit.value.url]).toEqual([
      'Jane Doe',
      'CC-BY-4.0',
      URL,
    ]);
  });

  it.each([
    ['', 'CC0', URL],
    ['Jane Doe', '  ', URL],
    ['Jane Doe', 'CC0', ''],
  ])('refuses a credit with a blank part (%p, %p, %p)', (author, license, url) => {
    expect(ImageCredit.create(author, license, url).ok).toBe(false);
  });

  // The line opens its link outside the app, so only a web address may get in.
  it.each(['javascript:alert(1)', 'file:///etc/hosts', 'commons.wikimedia.org/x'])(
    'refuses a link that is not http(s): %p',
    (url) => {
      expect(ImageCredit.create('Jane Doe', 'CC0', url).ok).toBe(false);
    },
  );

  it('compares by every part', () => {
    const a = ImageCredit.create('Jane Doe', 'CC0', URL);
    const b = ImageCredit.create('Jane Doe', 'CC0', URL);
    const c = ImageCredit.create('Jane Doe', 'PD', URL);
    if (!a.ok || !b.ok || !c.ok) throw new Error('expected credits');
    expect(a.value.equals(b.value)).toBe(true);
    expect(a.value.equals(c.value)).toBe(false);
  });
});
