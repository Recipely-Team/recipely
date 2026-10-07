import { stepDurationMinutes } from '@presentation/app/recipes/[recipeId]/cook/model/step-duration-minutes';

describe('stepDurationMinutes — the timer a step offers', () => {
  it.each([
    ['Simmer for 10 minutes.', 10],
    ['Bake 25 min until golden', 25],
    ['Cook 10-15 minutes, stirring', 10],
    ['Rest for 1.5 hours', 90],
    ['Leave it 2 h in the fridge', 120],
    ['Kısık ateşte 35 dakika pişirin', 35],
    ['Fırında 1 saat pişirin', 60],
    ['5 dakikada bir karıştırın', 5],
    ['Etwa 20 Minuten köcheln lassen', 20],
    ['Cocinar 8 minutos', 8],
    ['弱火で10分煮る', 10],
    ['煮 15分钟', 15],
    ['Варить 12 минут', 12],
  ])('%s → %d', (step, minutes) => {
    expect(stepDurationMinutes(step)).toBe(minutes);
  });

  it.each([
    'Add 2 eggs and stir',
    'Preheat the oven to 180 C',
    'Use 2 hot pans',
    'Season to taste',
  ])('offers no timer for "%s"', (step) => {
    expect(stepDurationMinutes(step)).toBeNull();
  });
});
