import { Difficulty } from '@domain/recipes/difficulty';
import { diffEditableRecipes } from '@presentation/app/create-recipe/model/refine/diff-editable-recipes';
import { RecipeChangeKind } from '@presentation/app/create-recipe/model/refine/recipe-change-kind';

import type { EditableRecipe } from '@presentation/app/create-recipe/model/drafting/editable-recipe';

const base: EditableRecipe = {
  name: 'Mercimek çorbası',
  cuisine: 'TURKISH',
  category: 'SOUP',
  difficulty: Difficulty.Easy,
  prepTimeMinutes: 10,
  cookTimeMinutes: 25,
  servings: 4,
  ingredients: ['1 su bardağı mercimek', '1 soğan'],
  instructions: ['Soğanı kavur', 'Mercimeği ekle'],
  media: [],
};

const withChanges = (patch: Partial<EditableRecipe>): EditableRecipe => ({ ...base, ...patch });

describe('diffEditableRecipes', () => {
  it('reports nothing when the assistant hands back the recipe it was given', () => {
    expect(diffEditableRecipes(base, { ...base })).toEqual([]);
  });

  it('reports a scalar field as before and after', () => {
    const changes = diffEditableRecipes(base, withChanges({ servings: 8 }));

    expect(changes).toEqual([
      { field: 'servings', kind: RecipeChangeKind.Value, before: '4', after: '8' },
    ]);
  });

  it('reports added and removed lines for a list field', () => {
    const changes = diffEditableRecipes(
      base,
      withChanges({ ingredients: ['1 su bardağı mercimek', '1 çay kaşığı pul biber'] }),
    );

    expect(changes).toEqual([
      {
        field: 'ingredients',
        kind: RecipeChangeKind.List,
        added: ['1 çay kaşığı pul biber'],
        removed: ['1 soğan'],
      },
    ]);
  });

  // WHY: a positional comparison would call every following step "changed"
  // when one is inserted at the top — true of the indices, and useless to a
  // cook trying to see what the assistant actually did.
  it('does not report untouched steps as changed when one is inserted above them', () => {
    const changes = diffEditableRecipes(
      base,
      withChanges({ instructions: ['Malzemeleri hazırla', 'Soğanı kavur', 'Mercimeği ekle'] }),
    );

    expect(changes).toEqual([
      {
        field: 'instructions',
        kind: RecipeChangeKind.List,
        added: ['Malzemeleri hazırla'],
        removed: [],
      },
    ]);
  });

  // WHY: `cuisine` is the one nullable field. Stringifying it naively puts the
  // word "null" in front of the user, inside the card meant to explain a change.
  it('renders an unset cuisine as empty, never as the word null', () => {
    const changes = diffEditableRecipes(withChanges({ cuisine: null }), base);

    expect(changes).toEqual([
      { field: 'cuisine', kind: RecipeChangeKind.Value, before: '', after: 'TURKISH' },
    ]);
  });

  // WHY: a refinement carries the existing photos forward untouched, so any
  // difference here would be an artefact of the mapping, not a proposal.
  it('never reports media', () => {
    const changes = diffEditableRecipes(
      base,
      withChanges({ media: [{ type: 'image', url: 'https://example.test/a.jpg' }] }),
    );

    expect(changes).toEqual([]);
  });

  it('lists every changed field when a refinement rewrites the recipe', () => {
    const changes = diffEditableRecipes(
      base,
      withChanges({ name: 'Acılı mercimek çorbası', difficulty: Difficulty.Medium, instructions: ['Hepsini kaynat'] }),
    );

    expect(changes.map((c) => c.field)).toEqual(['name', 'difficulty', 'instructions']);
  });
});
