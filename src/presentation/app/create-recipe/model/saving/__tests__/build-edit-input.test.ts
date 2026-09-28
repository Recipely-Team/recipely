import { buildEditInput } from '@presentation/app/create-recipe/model/saving/build-edit-input';
import { emptyEditable } from '@presentation/app/create-recipe/model/drafting/empty-editable';

describe('buildEditInput', () => {
  it('sends the editable fields keyed by locale, cleaned, and no photos', () => {
    const input = buildEditInput(
      {
        ...emptyEditable(),
        name: '  Menemen ',
        ingredients: ['yumurta', ' ', '# '],
        instructions: ['pişir', ''],
        media: [{ type: 'image', url: 'https://x.test/p.jpg' }],
      },
      'tr',
    );

    expect(input.name).toEqual({ tr: 'Menemen' });
    expect(input.ingredients).toEqual({ tr: ['yumurta'] });
    expect(input.instructions).toEqual({ tr: ['pişir'] });
    expect(input).not.toHaveProperty('media');
  });
});
