import { act } from 'react-test-renderer';
import { RecipeFloatingActions } from '@presentation/app/recipes/[recipeId]/body/recipe-floating-actions';
import { renderComponent } from '@presentation/base/test-support/render-component';
import { t } from '@presentation/i18n';

const mockPush = jest.fn();
jest.mock('expo-router', () => ({ useRouter: () => ({ push: mockPush }) }));

const render = (canCook: boolean) =>
  renderComponent(
    <RecipeFloatingActions
      insetsTop={0}
      recipeId="r 1"
      canCook={canCook}
      liked={false}
      isSaved={false}
      saveDisabled={false}
      onShare={jest.fn()}
      onCopyToDraft={jest.fn()}
      onToggleLike={jest.fn()}
      onToggleSave={jest.fn()}
    />,
  ).root;

const cookButtons = (canCook: boolean) =>
  render(canCook).findAll((node) => node.props.accessibilityLabel === t().cookMode.start && typeof node.props.onPress === 'function');

describe('the recipe page opens cook mode', () => {
  it('pushes cook mode for this recipe from the floating actions', () => {
    const [button] = cookButtons(true);
    const onPress = button?.props.onPress as () => void;
    act(() => onPress());
    expect(mockPush).toHaveBeenCalledWith('/recipes/r%201/cook');
  });

  it('offers no cook button for a recipe without steps', () => {
    expect(cookButtons(false)).toHaveLength(0);
  });
});
