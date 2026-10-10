import { toFridgeIngredients } from '@infrastructure/fridge/read/to-fridge-ingredients';
import { toFridgeIdea } from '@infrastructure/fridge/read/to-fridge-idea';
import { toFridgeIdeas } from '@infrastructure/fridge/read/to-fridge-ideas';
import { toFridgeIdeasRequest } from '@infrastructure/fridge/write/to-fridge-ideas-request';
import { FridgeDiet } from '@domain/fridge/ideas/fridge-diet';
import type { FridgeIdeaDto } from '@infrastructure/fridge/dtos/fridge-idea-dto';

/** Wire samples in the shape of the backend contract (recipely-backend #393). */
const SCAN_SAMPLE = {
  ingredients: [
    { name: 'eggs', confidence: 'high' },
    { name: ' spinach ', confidence: 'low' },
    { name: '', confidence: 'high' },
    { name: 'feta', confidence: 'medium' },
  ],
};

const IDEA_SAMPLE: FridgeIdeaDto = {
  title: 'Spinach & feta omelette',
  summary: 'A quick folded omelette with wilted spinach.',
  totalMinutes: 15,
  difficulty: 'EASY',
  uses: ['eggs', 'spinach'],
  missing: ['feta', 'chives', 'butter', 'pepper', 'salt', 'dill'],
};

describe('toFridgeIngredients', () => {
  it('keeps named rows, trims them, and reads anything but "high" as not sure', () => {
    const r = toFridgeIngredients(SCAN_SAMPLE);
    expect(r.ok && r.value).toEqual([
      { name: 'eggs', confidence: 'high' },
      { name: 'spinach', confidence: 'low' },
      { name: 'feta', confidence: 'low' },
    ]);
  });
});

describe('toFridgeIdea / toFridgeIdeas', () => {
  it('maps a wire idea, cutting missing items to five', () => {
    const r = toFridgeIdea(IDEA_SAMPLE);
    expect(r.ok && r.value).toEqual({
      title: 'Spinach & feta omelette',
      summary: 'A quick folded omelette with wilted spinach.',
      totalMinutes: 15,
      difficulty: 'EASY',
      uses: ['eggs', 'spinach'],
      missing: ['feta', 'chives', 'butter', 'pepper', 'salt'],
    });
  });

  it('fails an unknown difficulty, and the list keeps the other ideas', () => {
    expect(toFridgeIdea({ ...IDEA_SAMPLE, difficulty: 'EXPERT' }).ok).toBe(false);
    const r = toFridgeIdeas({ ideas: [IDEA_SAMPLE, { ...IDEA_SAMPLE, title: 'Bad', difficulty: 'EXPERT' }, { ...IDEA_SAMPLE, title: 'Shakshuka', difficulty: 'MEDIUM' }] });
    expect(r.ok && r.value.map((idea) => idea.title)).toEqual(['Spinach & feta omelette', 'Shakshuka']);
  });
});

describe('toFridgeIdeasRequest', () => {
  it('sends every filter that is set', () => {
    expect(
      toFridgeIdeasRequest({ ingredients: ['eggs'], maxMinutes: 30, diet: FridgeDiet.Vegan, servings: 4, exclude: ['Omelette'], locale: 'tr' }),
    ).toEqual({ ingredients: ['eggs'], maxMinutes: 30, diet: 'vegan', servings: 4, exclude: ['Omelette'], locale: 'tr' });
  });

  it('leaves out any time, no diet, an empty exclude and an unknown locale', () => {
    expect(
      toFridgeIdeasRequest({ ingredients: ['eggs'], maxMinutes: null, diet: FridgeDiet.None, servings: 2, exclude: [], locale: null }),
    ).toEqual({ ingredients: ['eggs'], servings: 2 });
  });
});
