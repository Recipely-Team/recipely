import { buildCreateRecipeFormData } from '@infrastructure/recipes/create/build-create-recipe-form-data';
import type { CreateRecipeInput } from '@domain/recipes/create/create-recipe-input';
import { Difficulty } from '@domain/recipes/difficulty';

jest.mock('@infrastructure/network/upload/append-file-part', () => ({
  appendFilePart: jest.fn(async (formData: FormData, field: string, part: { fileName: string }) => {
    formData.append(field, part.fileName);
  }),
}));

/**
 * `POST /recipes/with-media` reads `req.body.image` only when no file was
 * uploaded. That is the seam an Instagram import needs: its cover is already
 * stored server-side, so it travels as a field while device photos travel as
 * files.
 */

const base: CreateRecipeInput = {
  name: { tr: 'Menemen' },
  cuisine: 'TURKISH',
  category: 'BREAKFAST',
  difficulty: Difficulty.Easy,
  ingredients: { tr: ['yumurta'] },
  instructions: { tr: ['pişir'] },
  prepTimeMinutes: 5,
  cookTimeMinutes: 10,
  servings: 2,
  media: [],
};

describe('buildCreateRecipeFormData', () => {
  it('sends a hosted cover as the plain image field', async () => {
    const url = 'https://api.recipely.net/uploads/imports/6f1c.webp';

    const formData = await buildCreateRecipeFormData({ ...base, imageUrl: url });

    expect(formData.get('image')).toBe(url);
  });

  it('omits the image field when every photo is a local file', async () => {
    const formData = await buildCreateRecipeFormData({
      ...base,
      media: [{ uri: 'file:///tmp/a.jpg', fileName: 'a.jpg', mimeType: 'image/jpeg', type: 'image' }],
    });

    expect(formData.get('image')).toBeNull();
    expect(formData.get('media')).toBe('a.jpg');
  });

  it('sends both when the user added a photo to an imported recipe', async () => {
    const formData = await buildCreateRecipeFormData({
      ...base,
      media: [{ uri: 'file:///tmp/a.jpg', fileName: 'a.jpg', mimeType: 'image/jpeg', type: 'image' }],
      imageUrl: 'https://api.recipely.net/uploads/imports/6f1c.webp',
    });

    // The uploaded file wins the cover slot server-side; the field is the
    // fallback, so sending both is safe and keeps the import's frame available.
    expect(formData.get('media')).toBe('a.jpg');
    expect(formData.get('image')).toBe('https://api.recipely.net/uploads/imports/6f1c.webp');
  });
});

describe('buildCreateRecipeFormData — the draft being published', () => {
  // The server retires the draft it is named here: the import notification that
  // opens that draft is repointed at the new recipe before the row goes. Losing
  // the field means the notification keeps pointing at something publishing has
  // deleted, which is the error the user hit after publishing an import.
  it('names the draft the publish came from', async () => {
    const formData = await buildCreateRecipeFormData({ ...base, fromDraftId: 'draft-7' });

    expect(formData.get('fromDraftId')).toBe('draft-7');
  });

  it('omits it for a recipe written from scratch', async () => {
    const formData = await buildCreateRecipeFormData(base);

    expect(formData.get('fromDraftId')).toBeNull();
  });
});
