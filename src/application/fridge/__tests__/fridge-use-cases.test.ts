import { ok } from '@core/result/result-helpers';
import { ErrorMessageKey } from '@core/failure';
import type { FridgeRepositoryInterface } from '@domain/fridge/fridge-repository-interface';
import { FridgeDiet } from '@domain/fridge/ideas/fridge-diet';
import type { FridgeIdeasInput } from '@domain/fridge/ideas/fridge-ideas-input';
import type { FridgeScanInput } from '@domain/fridge/scan/fridge-scan-input';
import { ScanFridgeUseCase } from '@application/fridge/scan-fridge-use-case';
import { SuggestFridgeIdeasUseCase } from '@application/fridge/suggest-fridge-ideas-use-case';
import { configureFridgeStore } from '@application/fridge/fridge-store';
import { FridgeAvailability } from '@application/fridge/fridge-availability';

const repo = (): jest.Mocked<FridgeRepositoryInterface> => ({
  scan: jest.fn((_input: FridgeScanInput) => Promise.resolve(ok([]))),
  suggestIdeas: jest.fn((_input: FridgeIdeasInput) => Promise.resolve(ok([]))),
});

const photo = { uri: 'file:///a.jpg', fileName: 'a.jpg', mimeType: 'image/jpeg' };

const ideasInput = (over: Partial<FridgeIdeasInput> = {}): FridgeIdeasInput => ({
  ingredients: ['eggs'], maxMinutes: null, diet: FridgeDiet.None, servings: 2, exclude: [], locale: null, ...over,
});

describe('ScanFridgeUseCase', () => {
  it('refuses no photo and more than three with the server keys, without a request', async () => {
    const r = repo();
    const none = await new ScanFridgeUseCase(r).execute({ photos: [], locale: null });
    const many = await new ScanFridgeUseCase(r).execute({ photos: [photo, photo, photo, photo], locale: null });
    expect(!none.ok && none.failure.messageKey).toBe(ErrorMessageKey.fridgeNoPhotos);
    expect(!many.ok && many.failure.messageKey).toBe(ErrorMessageKey.fridgeTooManyPhotos);
    expect(r.scan).not.toHaveBeenCalled();
  });

  it('passes one to three photos on', async () => {
    const r = repo();
    await new ScanFridgeUseCase(r).execute({ photos: [photo, photo, photo], locale: 'en' });
    expect(r.scan).toHaveBeenCalledWith({ photos: [photo, photo, photo], locale: 'en' });
  });
});

describe('SuggestFridgeIdeasUseCase', () => {
  it('refuses an empty (or all-blank) list with ingredients_required, without a request', async () => {
    const r = repo();
    const result = await new SuggestFridgeIdeasUseCase(r).execute(ideasInput({ ingredients: ['  ', ''] }));
    expect(!result.ok && result.failure.messageKey).toBe(ErrorMessageKey.fridgeIngredientsRequired);
    expect(r.suggestIdeas).not.toHaveBeenCalled();
  });

  it('normalises names, clamps servings and keeps only the latest twelve excluded titles', async () => {
    const r = repo();
    const exclude = Array.from({ length: 15 }, (_, i) => `Idea ${i}`);
    await new SuggestFridgeIdeasUseCase(r).execute(ideasInput({ ingredients: [' Eggs', 'eggs', 'milk'], servings: 40, exclude }));
    const sent = r.suggestIdeas.mock.calls[0]?.[0];
    expect(sent?.ingredients).toEqual(['Eggs', 'milk']);
    expect(sent?.servings).toBe(12);
    expect(sent?.exclude).toEqual(exclude.slice(3));
  });
});

describe('fridge store', () => {
  it('resolves the flag once and reports it', async () => {
    const isEnabled = jest.fn(() => Promise.resolve(true));
    const r = repo();
    const store = configureFridgeStore({ scan: new ScanFridgeUseCase(r), suggestIdeas: new SuggestFridgeIdeasUseCase(r), isEnabled });
    expect(store.getState().availability).toBe(FridgeAvailability.Unknown);
    await Promise.all([store.getState().checkAvailability(), store.getState().checkAvailability()]);
    await store.getState().checkAvailability();
    expect(store.getState().availability).toBe(FridgeAvailability.On);
    expect(isEnabled).toHaveBeenCalledTimes(1);
  });

  it('reads a flag that is off as Off', async () => {
    const r = repo();
    const store = configureFridgeStore({ scan: new ScanFridgeUseCase(r), suggestIdeas: new SuggestFridgeIdeasUseCase(r), isEnabled: () => Promise.resolve(false) });
    await store.getState().checkAvailability();
    expect(store.getState().availability).toBe(FridgeAvailability.Off);
  });
});
