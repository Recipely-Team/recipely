import type { DraftRecipeSnapshot } from '@domain/drafts/draft-recipe-snapshot';
import { MediaType } from '@domain/recipes/media/media-type';
import type { MediaItem } from '@domain/recipes/media/media-item';
import { CuisineKey } from '@domain/recipes/taxonomy/cuisine-key';
import { Difficulty } from '@domain/recipes/difficulty';
import { RecipeEntity } from '@domain/recipes/recipe-entity';
import { RecipeCategory } from '@domain/recipes/taxonomy/recipe-category';
import type { EditableRecipe } from '@presentation/app/create-recipe/model/drafting/editable-recipe';
import { editableHasContent } from '@presentation/app/create-recipe/model/drafting/editable-has-content';
import { editableToSnapshot } from '@presentation/app/create-recipe/model/drafting/editable-to-snapshot';
import { emptyEditable } from '@presentation/app/create-recipe/model/drafting/empty-editable';
import { recipeToEditable } from '@presentation/app/create-recipe/model/drafting/recipe-to-editable';
import { snapshotToEditable } from '@presentation/app/create-recipe/model/drafting/snapshot-to-editable';

const makeRecipe = (overrides: Partial<Parameters<typeof RecipeEntity.create>[0]> = {}): RecipeEntity => {
  const result = RecipeEntity.create({
    id: 'r1',
    name: 'Stub Recipe',
    cuisine: CuisineKey.Italian,
    category: RecipeCategory.Dinner,
    difficulty: Difficulty.Easy,
    ingredients: ['flour'],
    instructions: ['mix'],
    prepTimeMinutes: 10,
    cookTimeMinutes: 20,
    servings: 2,
    caloriesPerServing: 0,
    image: 'https://cdn.example.com/r1.webp',
    media: [{ type: 'image', url: 'https://cdn.example.com/r1.webp' }],
    rating: 4.5,
    tags: ['quick'],
    mealType: ['Dinner'],
    ownerId: 'owner-1',
    likeCount: 0,
    likedByMe: false,
    viewCount: 0,
    moderationStatus: 'approved',
    commentCount: 0,
    ...overrides,
  });

  if (!result.ok) throw new Error('failed to build Recipe fixture');

  return result.value;
};

const makeEditable = (overrides: Partial<EditableRecipe> = {}): EditableRecipe => ({
  ...emptyEditable(),
  ...overrides,
});

describe('emptyEditable', () => {
  it('returns a null cuisine so the picker shows its unselected placeholder', () => {
    const editable = emptyEditable();

    expect(editable.cuisine).toBeNull();
  });

  it('defaults the category to MainCourse', () => {
    const editable = emptyEditable();

    expect(editable.category).toBe(RecipeCategory.MainCourse);
  });

  it('seeds ingredients and instructions with a single blank row', () => {
    const editable = emptyEditable();

    expect(editable.ingredients).toEqual(['']);
    expect(editable.instructions).toEqual(['']);
  });

  it('starts with no media', () => {
    const editable = emptyEditable();

    expect(editable.media).toEqual([]);
  });
});

describe('recipeToEditable', () => {
  const prevMedia: readonly MediaItem[] = [
    { type: 'image', url: 'https://cdn.example.com/prev.webp' },
  ];

  it('passes a CuisineKey straight through without converting to a display string', () => {
    const recipe = makeRecipe({ cuisine: CuisineKey.Italian });

    const editable = recipeToEditable(recipe, prevMedia);

    expect(editable.cuisine).toBe(CuisineKey.Italian);
  });

  it('keeps OTHER as OTHER rather than nulling it out', () => {
    const recipe = makeRecipe({ cuisine: CuisineKey.Other });

    const editable = recipeToEditable(recipe, prevMedia);

    expect(editable.cuisine).toBe(CuisineKey.Other);
  });

  it('passes the category through unchanged', () => {
    const recipe = makeRecipe({ category: RecipeCategory.Dessert });

    const editable = recipeToEditable(recipe, prevMedia);

    expect(editable.category).toBe(RecipeCategory.Dessert);
  });

  it('uses the recipe media when it has some', () => {
    const recipe = makeRecipe({
      media: [{ type: 'image', url: 'https://cdn.example.com/own.webp' }],
    });

    const editable = recipeToEditable(recipe, prevMedia);

    expect(editable.media).toEqual([{ type: 'image', url: 'https://cdn.example.com/own.webp' }]);
  });

  it('falls back to prevMedia when the recipe has no media', () => {
    const recipe = makeRecipe({ media: [] });

    const editable = recipeToEditable(recipe, prevMedia);

    expect(editable.media).toEqual(prevMedia);
  });

  it('replaces empty ingredients and instructions with a single blank row', () => {
    const recipe = makeRecipe({ ingredients: [], instructions: [] });

    const editable = recipeToEditable(recipe, prevMedia);

    expect(editable.ingredients).toEqual(['']);
    expect(editable.instructions).toEqual(['']);
  });
});

describe('snapshotToEditable', () => {
  it('parses a valid cuisine string into its CuisineKey', () => {
    const snapshot: DraftRecipeSnapshot = { cuisine: 'TURKISH' };

    const editable = snapshotToEditable(snapshot);

    expect(editable.cuisine).toBe(CuisineKey.Turkish);
  });

  it('preserves a cuisine key the local enum does not know (backend owns the catalog)', () => {
    const snapshot: DraftRecipeSnapshot = { cuisine: 'GEORGIAN' };

    const editable = snapshotToEditable(snapshot);

    expect(editable.cuisine).toBe('GEORGIAN');
  });

  it('parses an empty cuisine string to null', () => {
    const snapshot: DraftRecipeSnapshot = { cuisine: '' };

    const editable = snapshotToEditable(snapshot);

    expect(editable.cuisine).toBeNull();
  });

  it('falls back to the empty-editable cuisine when the field is absent', () => {
    const snapshot: DraftRecipeSnapshot = {};

    const editable = snapshotToEditable(snapshot);

    expect(editable.cuisine).toBeNull();
  });

  it('falls back to emptyEditable defaults for absent fields', () => {
    const snapshot: DraftRecipeSnapshot = {};
    const base = emptyEditable();

    const editable = snapshotToEditable(snapshot);

    expect(editable.name).toBe(base.name);
    expect(editable.category).toBe(base.category);
    expect(editable.difficulty).toBe(base.difficulty);
    expect(editable.prepTimeMinutes).toBe(base.prepTimeMinutes);
    expect(editable.cookTimeMinutes).toBe(base.cookTimeMinutes);
    expect(editable.servings).toBe(base.servings);
    expect(editable.ingredients).toEqual(base.ingredients);
    expect(editable.instructions).toEqual(base.instructions);
    expect(editable.media).toEqual([]);
  });

  it('ignores an unknown difficulty and keeps the default', () => {
    const snapshot: DraftRecipeSnapshot = { difficulty: 'IMPOSSIBLE' };

    const editable = snapshotToEditable(snapshot);

    expect(editable.difficulty).toBe(Difficulty.Easy);
  });

  it('keeps only image media items', () => {
    const snapshot: DraftRecipeSnapshot = {
      media: [
        { type: 'image', url: 'https://cdn.example.com/a.webp' },
        { type: 'video', url: 'https://cdn.example.com/b.mp4' },
      ],
    };

    const editable = snapshotToEditable(snapshot);

    expect(editable.media).toEqual([{ type: 'image', url: 'https://cdn.example.com/a.webp' }]);
  });
});

describe('editableToSnapshot', () => {
  it('serializes a null cuisine to an empty string', () => {
    const editable = makeEditable({ cuisine: null });

    const snapshot = editableToSnapshot(editable);

    expect(snapshot.cuisine).toBe('');
  });

  it('serializes a selected cuisine to its key string', () => {
    const editable = makeEditable({ cuisine: CuisineKey.Mexican });

    const snapshot = editableToSnapshot(editable);

    expect(snapshot.cuisine).toBe(CuisineKey.Mexican);
  });

  it('trims ingredients and instructions and drops blank entries', () => {
    const editable = makeEditable({
      ingredients: ['  flour  ', '', '   ', 'sugar'],
      instructions: ['mix', '  ', '  bake '],
    });

    const snapshot = editableToSnapshot(editable);

    expect(snapshot.ingredients).toEqual(['flour', 'sugar']);
    expect(snapshot.instructions).toEqual(['mix', 'bake']);
  });

  it('keeps only image media items', () => {
    const editable = makeEditable({
      media: [
        { type: 'image', url: 'https://cdn.example.com/a.webp' },
        { type: 'video', url: 'https://cdn.example.com/b.mp4' },
      ],
    });

    const snapshot = editableToSnapshot(editable);

    expect(snapshot.media).toEqual([{ type: 'image', url: 'https://cdn.example.com/a.webp' }]);
  });
});

describe('editableToSnapshot then snapshotToEditable round-trip', () => {
  it('preserves a selected cuisine key', () => {
    const editable = makeEditable({ cuisine: CuisineKey.Korean });

    const restored = snapshotToEditable(editableToSnapshot(editable));

    expect(restored.cuisine).toBe(CuisineKey.Korean);
  });

  it('preserves an unselected cuisine through the empty-string hop (null -> "" -> null)', () => {
    const editable = makeEditable({ cuisine: null });

    const snapshot = editableToSnapshot(editable);
    const restored = snapshotToEditable(snapshot);

    expect(snapshot.cuisine).toBe('');
    expect(restored.cuisine).toBeNull();
  });
});

describe('editableHasContent', () => {
  it('is false for a pristine empty model', () => {
    expect(editableHasContent(emptyEditable())).toBe(false);
  });

  it('is false when name and rows contain only whitespace', () => {
    const editable = makeEditable({
      name: '   ',
      ingredients: ['', '  '],
      instructions: ['   '],
    });

    expect(editableHasContent(editable)).toBe(false);
  });

  it('is true when the name has content', () => {
    const editable = makeEditable({ name: 'Soup' });

    expect(editableHasContent(editable)).toBe(true);
  });

  it('is true when any ingredient has content', () => {
    const editable = makeEditable({ ingredients: ['', 'salt'] });

    expect(editableHasContent(editable)).toBe(true);
  });

  it('is true when any instruction has content', () => {
    const editable = makeEditable({ instructions: ['   ', 'stir'] });

    expect(editableHasContent(editable)).toBe(true);
  });
});

// ─── the regression: opening an imported draft destroyed it ──────────────────
// An Instagram import writes a full recipe — category, tags, mealType, tips,
// nutrition, caloriesPerServing — and stores its chosen cover frame in `image`,
// leaving `media` empty. The editor models none of that. Autosave fires on
// OPEN, so merely looking at an imported draft saved the editor's narrow
// projection over the rich one: the cover and everything the AI had extracted
// were gone, and the screen said "no photo yet" about a frame that existed and
// was being served. Measured on dev 2026-08-08: imported drafts that had been
// opened held 9 snapshot keys, untouched ones held 16.
describe('an imported draft opened in the editor', () => {
  const imported = (): DraftRecipeSnapshot => ({
    name: 'Menemen',
    cuisine: 'TURKISH',
    difficulty: 'EASY',
    prepTimeMinutes: 5,
    cookTimeMinutes: 10,
    servings: 2,
    ingredients: ['eggs', 'tomato'],
    instructions: ['cook'],
    media: [],
    image: 'https://dev-api.recipely.net/uploads/imports/cover.webp',
    category: 'BREAKFAST',
    tags: ['quick'],
    mealType: ['breakfast'],
    tips: ['use a wide pan'],
    caloriesPerServing: 300,
    nutrition: { protein: 12, carbs: 8, fat: 20, fiber: 1 },
  });

  it('shows the imported cover instead of claiming there is no photo', () => {
    const editable = snapshotToEditable(imported());

    expect(editable.media).toEqual([
      { type: 'image', url: 'https://dev-api.recipely.net/uploads/imports/cover.webp' },
    ]);
  });

  it('keeps the cover when the draft is saved straight back', () => {
    const snapshot = editableToSnapshot(snapshotToEditable(imported()), imported());

    expect(snapshot.image).toBe('https://dev-api.recipely.net/uploads/imports/cover.webp');
  });

  it.each(['category', 'tags', 'mealType', 'tips', 'caloriesPerServing', 'nutrition'] as const)(
    'does not delete %s, which the editor has no field for',
    (field) => {
      const base = imported();

      const snapshot = editableToSnapshot(snapshotToEditable(base), base);

      expect(snapshot[field]).toEqual(base[field]);
    },
  );

  it('lets a photo the user picks replace the imported cover', () => {
    // The cover must follow what is on screen. A draft whose `image` said one
    // thing and whose `media` said another is how this bug started.
    const base = imported();
    const editable = snapshotToEditable(base);
    const chosen = { type: MediaType.Image, url: 'https://cdn.recipely.net/u/mine.jpg' };

    const snapshot = editableToSnapshot({ ...editable, media: [chosen] }, base);

    expect(snapshot.image).toBe(chosen.url);
    expect(snapshot.media).toEqual([chosen]);
  });

  it('leaves a draft that never had these fields exactly as narrow as before', () => {
    // A draft started in the editor carries no import fields, and must not grow
    // empty ones — an `image: undefined` key would round-trip as a change and
    // make the exit dialog ask about work nobody did.
    const editable = snapshotToEditable({ name: 'Plain', ingredients: ['x'], instructions: ['y'] });

    const snapshot = editableToSnapshot(editable, undefined);

    expect(Object.keys(snapshot)).not.toContain('image');
    expect(Object.keys(snapshot)).not.toContain('category');
  });
});
