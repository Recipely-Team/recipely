import { normalizeFridgeIngredients } from '@domain/fridge/normalize-fridge-ingredients';
import { fridgeIdeaPrompt } from '@domain/fridge/ideas/fridge-idea-prompt';
import type { FridgePromptWording } from '@domain/fridge/ideas/fridge-prompt-wording';
import type { FridgeIdea } from '@domain/fridge/ideas/fridge-idea';
import { FridgeLimits } from '@domain/fridge/fridge-limits';
import { Difficulty } from '@domain/recipes/difficulty';

const wording: FridgePromptWording = {
  dish: (title, summary) => `Make "${title}": ${summary}`,
  have: (list) => `I have: ${list}`,
  missing: (list) => `Missing: ${list}`,
  maxTime: (minutes) => `Max ${minutes} min`,
  diet: (diet) => `Diet: ${diet}`,
  servings: (n) => `For ${n}`,
};

const idea: FridgeIdea = {
  title: 'Spinach omelette',
  summary: 'Eggs and spinach, folded.',
  totalMinutes: 15,
  difficulty: Difficulty.Easy,
  uses: ['eggs', 'spinach'],
  missing: ['feta'],
};

describe('normalizeFridgeIngredients', () => {
  it('trims, collapses spaces, drops blanks and keeps the first spelling of a duplicate', () => {
    expect(normalizeFridgeIngredients(['  Eggs ', 'eggs', '', '   ', 'red   pepper', 'EGGS'])).toEqual(['Eggs', 'red pepper']);
  });

  it('cuts a name to the server limit and keeps at most the server count', () => {
    const long = 'x'.repeat(FridgeLimits.ingredientNameMax + 10);
    expect(normalizeFridgeIngredients([long])[0]).toHaveLength(FridgeLimits.ingredientNameMax);
    const many = Array.from({ length: FridgeLimits.ingredientsMax + 5 }, (_, i) => `item ${i}`);
    expect(normalizeFridgeIngredients(many)).toHaveLength(FridgeLimits.ingredientsMax);
  });
});

describe('fridgeIdeaPrompt', () => {
  it('carries the title, summary, ingredients, missing items, filters and servings, one per line', () => {
    const prompt = fridgeIdeaPrompt({ idea, ingredients: ['eggs', 'spinach', 'milk'], maxMinutes: 30, dietLabel: 'Vegetarian', servings: 2 }, wording);
    expect(prompt.split('\n')).toEqual([
      'Make "Spinach omelette": Eggs and spinach, folded.',
      'I have: eggs, spinach, milk',
      'Missing: feta',
      'Max 30 min',
      'Diet: Vegetarian',
      'For 2',
    ]);
  });

  it('leaves out the lines with nothing to say', () => {
    const prompt = fridgeIdeaPrompt({ idea: { ...idea, missing: [] }, ingredients: ['eggs'], maxMinutes: null, dietLabel: null, servings: 4 }, wording);
    expect(prompt.split('\n')).toEqual(['Make "Spinach omelette": Eggs and spinach, folded.', 'I have: eggs', 'For 4']);
  });

  it('never exceeds the generator limit, shortening the ingredient list rather than dropping the dish', () => {
    const ingredients = Array.from({ length: 40 }, (_, i) => `${'ingredient'.repeat(14)} ${i}`);
    const prompt = fridgeIdeaPrompt({ idea, ingredients, maxMinutes: 15, dietLabel: null, servings: 2 }, wording);
    expect(prompt.length).toBeLessThanOrEqual(FridgeLimits.promptMax);
    expect(prompt.startsWith('Make "Spinach omelette"')).toBe(true);
    expect(prompt.endsWith('For 2')).toBe(true);
  });
});
