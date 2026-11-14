import { fridgeFilterFromVoice } from '@presentation/app/fridge/model/filters/fridge-filter-from-voice';

describe('fridgeFilterFromVoice', () => {
  it('reads the time, diet and servings the screen offers', () => {
    expect(fridgeFilterFromVoice('time', '30')).toEqual({ maxMinutes: 30 });
    expect(fridgeFilterFromVoice('time', 'any')).toEqual({ maxMinutes: null });
    expect(fridgeFilterFromVoice('Diet', 'high-protein')).toEqual({ diet: 'highProtein' });
    expect(fridgeFilterFromVoice('diet', 'any')).toEqual({ diet: 'none' });
    expect(fridgeFilterFromVoice('servings', '4')).toEqual({ servings: 4 });
  });

  it('refuses what the screen does not offer', () => {
    expect(fridgeFilterFromVoice('time', '45')).toBeNull();
    expect(fridgeFilterFromVoice('diet', 'keto')).toBeNull();
    expect(fridgeFilterFromVoice('servings', '20')).toBeNull();
    expect(fridgeFilterFromVoice('cuisine', 'italian')).toBeNull();
  });
});
