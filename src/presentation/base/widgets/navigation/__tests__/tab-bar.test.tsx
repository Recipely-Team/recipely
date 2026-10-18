import { TabBar } from '@presentation/base/widgets/navigation/tab-bar';
import { renderComponent } from '@presentation/base/test-support/render-component';
import { t } from '@presentation/i18n';

describe('TabBar', () => {
  it('draws five tabs in order, Chefs between My Recipes and Diary, each label shrinking to fit instead of being cut', () => {
    const { root } = renderComponent(<TabBar active="chefs" onChange={jest.fn()} />);
    const tabs = root.findAll((n) => n.props.accessibilityRole === 'tab' && typeof n.props.onPress === 'function');

    expect(tabs.map((tab) => tab.props.accessibilityLabel)).toEqual([
      t().navigation.recipes,
      t().navigation.myRecipes,
      t().navigation.chefs,
      t().navigation.diary,
      t().navigation.profile,
    ]);
    expect(tabs[2]?.props.accessibilityState).toEqual({ selected: true });
    // At Android's largest text the labels read "Recip…"; they now wrap and shrink, never cut.
    expect(
      root.findAll((n) => n.props.adjustsFontSizeToFit === true && n.props.numberOfLines === 1 && n.props.children === t().navigation.chefs).length,
    ).toBeGreaterThan(0);
  });
});
