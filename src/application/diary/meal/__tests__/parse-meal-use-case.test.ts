import { ErrorMessageKey } from '@core/failure';
import { ok } from '@core/result/result-helpers';
import type { FoodDiaryRepositoryInterface } from '@domain/diary/food-diary-repository-interface';
import { MealParseInputKind } from '@domain/diary/meal/meal-parse-input-kind';
import { mealCandidateOf } from '@domain/diary/__fixtures__/meal-candidate-of';
import { ParseMealUseCase } from '@application/diary/meal/parse-meal-use-case';

const makeRepo = () => {
  const parseMeal = jest.fn().mockResolvedValue(ok({ items: [mealCandidateOf()], note: null }));
  return { repo: { parseMeal } as unknown as FoodDiaryRepositoryInterface, parseMeal };
};

describe('ParseMealUseCase', () => {
  it('sends a description to the repository and returns its candidates', async () => {
    const { repo, parseMeal } = makeRepo();
    const input = { kind: MealParseInputKind.Text, text: 'menemen', locale: 'tr' } as const;
    const result = await new ParseMealUseCase(repo).execute(input);
    expect(parseMeal).toHaveBeenCalledWith(input);
    expect(result.ok && result.value.items).toHaveLength(1);
  });

  it('refuses a blank description before spending a request, with the server key', async () => {
    const { repo, parseMeal } = makeRepo();
    const result = await new ParseMealUseCase(repo).execute({ kind: MealParseInputKind.Text, text: '   ', locale: null });
    expect(parseMeal).not.toHaveBeenCalled();
    expect(!result.ok && result.failure.messageKey).toBe(ErrorMessageKey.mealParseInputRequired);
  });

  it('refuses a description past 500 characters with the server key', async () => {
    const { repo, parseMeal } = makeRepo();
    const result = await new ParseMealUseCase(repo).execute({ kind: MealParseInputKind.Text, text: 'a'.repeat(501), locale: null });
    expect(parseMeal).not.toHaveBeenCalled();
    expect(!result.ok && result.failure.messageKey).toBe(ErrorMessageKey.mealParseTextTooLong);
  });

  it('passes a photo straight through', async () => {
    const { repo, parseMeal } = makeRepo();
    const input = { kind: MealParseInputKind.Photo, uri: 'file:///m.jpg', fileName: 'meal-1.jpg', mimeType: 'image/jpeg', locale: null } as const;
    await new ParseMealUseCase(repo).execute(input);
    expect(parseMeal).toHaveBeenCalledWith(input);
  });
});
