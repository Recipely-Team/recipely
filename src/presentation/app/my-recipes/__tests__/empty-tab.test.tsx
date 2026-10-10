import { act } from 'react-test-renderer';
import { renderComponent, textContent } from '@presentation/base/test-support/render-component';
import { EmptyTab } from '@presentation/app/my-recipes/items/empty-tab';
import { TabType } from '@presentation/app/my-recipes/model/tab-type';
import { t } from '@presentation/i18n';

const press = (root: ReturnType<typeof renderComponent>['root'], label: string): void => {
  const button = root.find((n) => n.props.accessibilityRole === 'button' && typeof n.props.onPress === 'function' && textContent(n).includes(label));
  act(() => (button.props.onPress as () => void)());
};

/** An empty My Recipes tab stopped at a sentence; it now offers the action that fills it. */
describe('EmptyTab', () => {
  it.each([TabType.Saved, TabType.Liked])('sends an empty %s tab to the feed', (tab) => {
    const onBrowse = jest.fn();
    const { root } = renderComponent(<EmptyTab tab={tab} onBrowse={onBrowse} onCreate={jest.fn()} />);
    press(root, t().recipes.browseRecipes);
    expect(onBrowse).toHaveBeenCalledTimes(1);
  });

  it.each([TabType.Created, TabType.Drafts])('sends an empty %s tab to the create screen', (tab) => {
    const onCreate = jest.fn();
    const { root } = renderComponent(<EmptyTab tab={tab} onBrowse={jest.fn()} onCreate={onCreate} />);
    press(root, t().myRecipes.createNew);
    expect(onCreate).toHaveBeenCalledTimes(1);
  });
});
