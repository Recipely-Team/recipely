import { insertTokenAt } from '@presentation/app/automations/edit/model/insert-token-at';

describe('insertTokenAt', () => {
  it('puts the token where the caret is, not at the end', () => {
    expect(insertTokenAt('Selam !', { start: 6, end: 6 }, '{name}')).toEqual({ text: 'Selam {name}!', caret: 12 });
  });

  it('pads with a space only where the neighbour is not whitespace', () => {
    expect(insertTokenAt('Selam', { start: 5, end: 5 }, '{link}')).toEqual({ text: 'Selam {link}', caret: 12 });
    expect(insertTokenAt('ab', { start: 1, end: 1 }, '{name}').text).toBe('a {name} b');
  });

  it('replaces a selection and clamps an out-of-range caret', () => {
    expect(insertTokenAt('Selam X!', { start: 6, end: 7 }, '{name}').text).toBe('Selam {name}!');
    expect(insertTokenAt('', { start: 9, end: 9 }, '{link}')).toEqual({ text: '{link}', caret: 6 });
  });
});
