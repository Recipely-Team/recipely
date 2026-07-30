import { buildCreateInput } from '@presentation/app/create-recipe/model/saving/build-recipe-input';
import { emptyEditable } from '@presentation/app/create-recipe/model/drafting/recipe-mapping';
import type { EditableRecipe } from '@presentation/app/create-recipe/model/drafting/editable-recipe';
import type { MediaItem } from '@domain/recipes/media/media-item';

/**
 * The gallery mixes two things that look identical on screen: a photo the user
 * picked, which lives on the device and must be uploaded, and the cover an
 * Instagram import lifted out of the video, which the backend already stored
 * and serves over https. Treating the second as a file asks the device to
 * upload something it never had.
 */

const LOCAL: MediaItem = { type: 'image', url: 'file:///var/tmp/picked.jpg' };
const HOSTED: MediaItem = {
  type: 'image',
  url: 'https://api.recipely.net/uploads/imports/6f1c.webp',
};

const withMedia = (media: MediaItem[]): EditableRecipe => ({
  ...emptyEditable(),
  name: 'Menemen',
  ingredients: ['yumurta'],
  instructions: ['pişir'],
  media,
});

describe('buildCreateInput — cover from an Instagram import', () => {
  it('hands a hosted cover back as a URL instead of queueing it for upload', () => {
    const input = buildCreateInput(withMedia([HOSTED]), 'tr');

    expect(input.media).toEqual([]);
    expect(input.imageUrl).toBe(HOSTED.url);
  });

  it('still uploads a photo the user picked', () => {
    const input = buildCreateInput(withMedia([LOCAL]), 'tr');

    expect(input.media).toHaveLength(1);
    expect(input.media[0]?.uri).toBe(LOCAL.url);
    expect(input.imageUrl).toBeUndefined();
  });

  it('uploads the picked photo and still passes the hosted one along', () => {
    // The route prefers an uploaded file for the cover, so the user's own photo
    // wins — which is the precedence we want when both are present.
    const input = buildCreateInput(withMedia([HOSTED, LOCAL]), 'tr');

    expect(input.media.map((m) => m.uri)).toEqual([LOCAL.url]);
    expect(input.imageUrl).toBe(HOSTED.url);
  });

  it('omits imageUrl entirely when there is nothing hosted', () => {
    const input = buildCreateInput(withMedia([LOCAL]), 'tr');

    expect('imageUrl' in input).toBe(false);
  });

  it('treats http as hosted too, not just https', () => {
    const insecure: MediaItem = { type: 'image', url: 'http://10.0.2.2:3000/uploads/imports/a.webp' };

    expect(buildCreateInput(withMedia([insecure]), 'tr').imageUrl).toBe(insecure.url);
  });
});

describe('buildCreateInput — ingredient groups', () => {
  const withIngredients = (ingredients: string[]): EditableRecipe => ({
    ...emptyEditable(),
    name: 'Revani',
    ingredients,
    instructions: ['pişir'],
    media: [LOCAL],
  });

  it('keeps a named group in place, so the parts stay separated', () => {
    const input = buildCreateInput(
      withIngredients(['# Kek', '3 yumurta', '# Şerbet', '2 su bardağı şeker']),
      'tr',
    );

    expect(input.ingredients.tr).toEqual(['# Kek', '3 yumurta', '# Şerbet', '2 su bardağı şeker']);
  });

  it('drops a group the user added but never named', () => {
    // The editor writes the marker the moment "add a group" is tapped, so an
    // abandoned one would publish as a blank heading over the lines below it.
    const input = buildCreateInput(withIngredients(['# ', '3 yumurta']), 'tr');

    expect(input.ingredients.tr).toEqual(['3 yumurta']);
  });

  it('drops an unnamed group written without a space', () => {
    expect(buildCreateInput(withIngredients(['#', '3 yumurta']), 'tr').ingredients.tr).toEqual([
      '3 yumurta',
    ]);
  });
});
