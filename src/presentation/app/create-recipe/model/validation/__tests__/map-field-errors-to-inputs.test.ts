import { mapFieldErrorsToInputs } from '@presentation/app/create-recipe/model/validation/map-field-errors-to-inputs';

describe('mapFieldErrorsToInputs', () => {
  it('maps a single known field to its input', () => {
    const result = mapFieldErrorsToInputs([{ field: 'servings', message: 'Number must be >= 1' }]);
    expect(result).toEqual({ fields: { servings: 'Number must be >= 1' }, unmatched: [] });
  });

  it('maps every known screen field (cuisine/category/servings/difficulty/prep/cook/ingredients)', () => {
    const result = mapFieldErrorsToInputs([
      { field: 'cuisine', message: 'Invalid cuisine' },
      { field: 'category', message: 'Invalid category' },
      { field: 'servings', message: 'Too many servings' },
      { field: 'difficulty', message: 'Invalid difficulty' },
      { field: 'prepTimeMinutes', message: 'Prep time too long' },
      { field: 'cookTimeMinutes', message: 'Cook time too long' },
      { field: 'ingredients', message: 'At least one ingredient is required' },
    ]);
    expect(result.fields).toEqual({
      cuisine: 'Invalid cuisine',
      category: 'Invalid category',
      servings: 'Too many servings',
      difficulty: 'Invalid difficulty',
      prepTimeMinutes: 'Prep time too long',
      cookTimeMinutes: 'Cook time too long',
      ingredients: 'At least one ingredient is required',
    });
    expect(result.unmatched).toEqual([]);
  });

  it('matches only the leading segment of a nested Zod path (e.g. name.en)', () => {
    const result = mapFieldErrorsToInputs([{ field: 'name.en', message: 'Too short' }]);
    expect(result.fields).toEqual({ name: 'Too short' });
  });

  it('matches only the leading segment of a nested array path (e.g. ingredients.en.0)', () => {
    const result = mapFieldErrorsToInputs([{ field: 'ingredients.en.0', message: 'Too short' }]);
    expect(result.fields).toEqual({ ingredients: 'Too short' });
  });

  it('routes a field this screen does not render to unmatched, without dropping it', () => {
    const result = mapFieldErrorsToInputs([{ field: 'image', message: 'Must be a valid URL' }]);
    expect(result.fields).toEqual({});
    expect(result.unmatched).toEqual(['image: Must be a valid URL']);
  });

  it('routes a fieldless entry to unmatched using just its message', () => {
    const result = mapFieldErrorsToInputs([{ message: 'Request body must contain at least one field to update' }]);
    expect(result.unmatched).toEqual(['Request body must contain at least one field to update']);
  });

  it('keeps the first message when the same field appears more than once', () => {
    const result = mapFieldErrorsToInputs([
      { field: 'servings', message: 'first' },
      { field: 'servings', message: 'second' },
    ]);
    expect(result.fields.servings).toBe('first');
  });

  it('handles a mix of matched and unmatched entries in one failure', () => {
    const result = mapFieldErrorsToInputs([
      { field: 'cuisine', message: 'Invalid cuisine' },
      { field: 'tags.en', message: 'Too many tags' },
    ]);
    expect(result.fields).toEqual({ cuisine: 'Invalid cuisine' });
    expect(result.unmatched).toEqual(['tags.en: Too many tags']);
  });

  it('returns empty fields and unmatched for an empty list', () => {
    expect(mapFieldErrorsToInputs([])).toEqual({ fields: {}, unmatched: [] });
  });
});
