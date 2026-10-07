import { act } from 'react-test-renderer';
import type { ReactTestInstance } from 'react-test-renderer';
import { renderComponent } from '@presentation/base/test-support/render-component';
import { usePortionScaling } from '@presentation/app/recipes/[recipeId]/hooks/use-portion-scaling';
import { PortionStepper } from '@presentation/app/recipes/[recipeId]/items/meta/portion-stepper';
import type { PortionScaling } from '@presentation/app/recipes/[recipeId]/model/portions/portion-scaling';
import { recipeEntityOf } from '@application/__fixtures__/recipe-entity-of';
import type { RecipeEntity } from '@domain/recipes/recipe-entity';
import { UnitSystem } from '@domain/recipes/ingredients/unit-system';
import { RecipeLimits } from '@domain/recipes/recipe-limits';
import { t } from '@presentation/i18n';

/**
 * The recipe detail's servings stepper drives every ingredient amount on the
 * page; the unit toggle rewrites them; both start over on another recipe.
 */

const SOUP = recipeEntityOf({ id: 'soup', servings: 2, ingredients: ['# Çorba', '1 su bardağı mercimek', 'tuz'] });
const CAKE = recipeEntityOf({ id: 'cake', servings: 4, ingredients: ['2 cups flour'] });

const mount = (recipe: RecipeEntity): { latest: () => PortionScaling; root: ReactTestInstance; show: (next: RecipeEntity) => void } => {
  let latest: PortionScaling | null = null;
  const Probe = ({ of }: { of: RecipeEntity }): React.JSX.Element => {
    const portions = usePortionScaling(of);
    latest = portions;
    return <PortionStepper portions={portions} />;
  };
  const { root, renderer } = renderComponent(<Probe of={recipe} />);
  return {
    latest: () => {
      if (latest === null) throw new Error('not rendered');
      return latest;
    },
    root,
    show: (next) => act(() => renderer.update(<Probe of={next} />)),
  };
};

const button = (root: ReactTestInstance, label: string): ReactTestInstance => {
  const found = root.findAll((n) => n.props['accessibilityLabel'] === label && n.props['accessibilityRole'] === 'button');
  const first = found.at(0);
  if (first === undefined) throw new Error(`no button "${label}"`);
  return first;
};

describe('usePortionScaling with the stepper', () => {
  it('starts at the recipe’s own servings with its lines as written', () => {
    const view = mount(SOUP);
    expect(view.latest().servings).toBe(2);
    expect(view.latest().ingredients).toEqual(['# Çorba', '1 su bardağı mercimek', 'tuz']);
  });

  it('rescales the ingredients when "more servings" is pressed', () => {
    const view = mount(SOUP);
    act(() => (button(view.root, t().recipes.portions.increase).props['onPress'] as () => void)());
    expect(view.latest().servings).toBe(3);
    expect(view.latest().ingredients).toEqual(['# Çorba', '1½ su bardağı mercimek', 'tuz']);
  });

  it('converts the scaled lines when the unit system changes', () => {
    const view = mount(SOUP);
    act(() => view.latest().onIncrement());
    act(() => view.latest().onChangeUnitSystem(UnitSystem.Metric));
    expect(view.latest().ingredients[1]).toBe('300 ml mercimek');
  });

  it('does not step below the minimum, and says so to assistive tech', () => {
    const view = mount(recipeEntityOf({ servings: RecipeLimits.servingsMin }));
    const fewer = button(view.root, t().recipes.portions.decrease);
    expect(view.latest().canDecrement).toBe(false);
    expect(fewer.props['accessibilityState']).toEqual({ disabled: true });
  });

  it('starts over on another recipe', () => {
    const view = mount(SOUP);
    act(() => view.latest().onIncrement());
    act(() => view.latest().onChangeUnitSystem(UnitSystem.Metric));
    view.show(CAKE);
    expect(view.latest().servings).toBe(4);
    expect(view.latest().unitSystem).toBe(UnitSystem.Original);
    expect(view.latest().ingredients).toEqual(['2 cups flour']);
  });
});
