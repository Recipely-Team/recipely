import { configureStepProgressStore } from '@application/recipes/cooking/step-progress-store';

describe('step progress store', () => {
  it('toggles one step of one recipe and leaves other recipes alone', () => {
    const store = configureStepProgressStore();
    store.getState().toggleStep('a', 2);
    expect(store.getState().byRecipe.a?.[2]).toBe(true);
    expect(store.getState().byRecipe.b).toBeUndefined();
    store.getState().toggleStep('a', 2);
    expect(store.getState().byRecipe.a?.[2]).toBe(false);
  });

  it('sets a step done without rewriting one that is already done', () => {
    const store = configureStepProgressStore();
    store.getState().setStepDone('a', 0, true);
    const before = store.getState().byRecipe;
    store.getState().setStepDone('a', 0, true);
    expect(store.getState().byRecipe).toBe(before);
    expect(store.getState().byRecipe.a?.[0]).toBe(true);
  });

  it('clear forgets every recipe', () => {
    const store = configureStepProgressStore();
    store.getState().toggleStep('a', 0);
    store.getState().clear();
    expect(store.getState().byRecipe).toEqual({});
  });
});
