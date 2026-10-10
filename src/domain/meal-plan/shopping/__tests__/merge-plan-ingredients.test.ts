import { mergePlanIngredients } from '@domain/meal-plan/shopping/merge-plan-ingredients';
import { classifyGrocery } from '@domain/meal-plan/shopping/classify-grocery';
import { GroceryAisle } from '@domain/meal-plan/shopping/grocery-aisle';

const recipe = (recipeId: string, recipeName: string, ingredients: string[], plannedServings = 2, recipeServings = 2) => ({
  recipeId,
  recipeName,
  plannedServings,
  recipeServings,
  ingredients,
});

describe('mergePlanIngredients', () => {
  it('scales each recipe by planned / written servings', () => {
    const [line] = mergePlanIngredients([recipe('r1', 'Omlet', ['2 eggs'], 4, 2)]);
    expect(line?.drafts[0]?.quantity).toBe(4);
  });

  it('sums one unit across recipes and names both sources, without one recipe on the list', () => {
    const lines = mergePlanIngredients([recipe('r1', 'Omlet', ['200 g cheese']), recipe('r2', 'Tost', ['100 g cheese'])]);
    const cheese = lines.find((line) => line.key === 'cheese');
    expect(cheese?.drafts).toHaveLength(1);
    expect(cheese?.drafts[0]?.quantity).toBe(300);
    expect(cheese?.sources).toEqual(['Omlet', 'Tost']);
    expect(cheese?.drafts[0]?.recipeId).toBeNull();
  });

  it('keeps different units of one ingredient side by side', () => {
    const lines = mergePlanIngredients([recipe('r1', 'A', ['200 g flour']), recipe('r2', 'B', ['2 cups flour'])]);
    expect(lines.find((line) => line.key === 'flour')?.drafts).toHaveLength(2);
  });

  it('leaves water out and flags salt as a staple', () => {
    const lines = mergePlanIngredients([recipe('r1', 'Çorba', ['6 cups water', '1 tsp salt', '1 onion'])]);
    expect(lines.map((line) => line.key)).not.toContain('water');
    expect(lines.find((line) => line.key === 'salt')?.isStaple).toBe(true);
  });

  it('orders lines by aisle', () => {
    const aisles = mergePlanIngredients([recipe('r1', 'A', ['1 tsp salt', '1 onion', '1 cup milk'])]).map((line) => line.aisle);
    const order = Object.values(GroceryAisle);
    expect([...aisles].sort((a, b) => order.indexOf(a) - order.indexOf(b))).toEqual(aisles);
  });
});

describe('classifyGrocery', () => {
  it('lets the longest keyword win', () => {
    expect(classifyGrocery('eggplant').aisle).toBe(GroceryAisle.Produce);
    expect(classifyGrocery('tereyağı').aisle).toBe(GroceryAisle.Dairy);
  });

  it('puts an unknown name in the pantry', () => {
    expect(classifyGrocery('xyzzy').aisle).toBe(GroceryAisle.Pantry);
  });

  it('skips water in either language', () => {
    expect(classifyGrocery('warm water').isSkipped).toBe(true);
    expect(classifyGrocery('ılık su').isSkipped).toBe(true);
  });
});
