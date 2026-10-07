import { configurePortionChoiceStore } from '@application/recipes/cooking/portion-choice-store';
import { UnitSystem } from '@domain/recipes/ingredients/unit-system';

describe('portionChoiceStore', () => {
  it('keeps servings and units per recipe, each without resetting the other', () => {
    const store = configurePortionChoiceStore();
    store.getState().setServings('soup', 6);
    store.getState().setUnitSystem('soup', UnitSystem.Metric);
    store.getState().setUnitSystem('cake', UnitSystem.Metric);

    expect(store.getState().byRecipe).toEqual({
      soup: { servings: 6, system: UnitSystem.Metric },
      cake: { servings: null, system: UnitSystem.Metric },
    });
  });

  it('forgets every choice when the session ends', () => {
    const store = configurePortionChoiceStore();
    store.getState().setServings('soup', 6);
    store.getState().clear();

    expect(store.getState().byRecipe).toEqual({});
  });
});
