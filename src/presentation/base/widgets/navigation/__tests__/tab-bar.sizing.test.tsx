import { StyleSheet, type ViewStyle } from 'react-native';
import { renderComponent } from '@presentation/base/test-support/render-component';
import { TabBar } from '@presentation/base/widgets/navigation/tab-bar';
import { TabBarKey } from '@presentation/base/widgets/navigation/tab-bar-key';

/**
 * Reported as: "the tab labels are cut off with large text." The bar had a
 * fixed `height` around its icon + label (rule 6b), so Dynamic Type clipped them.
 */
describe('TabBar sizing', () => {
  it('grows with its text and is announced as a tab list', () => {
    const { root } = renderComponent(<TabBar active={TabBarKey.Recipes} onChange={jest.fn()} />);
    const bar = root.find((n) => n.props.accessibilityRole === 'tablist');
    const style = StyleSheet.flatten(bar.props.style as ViewStyle);

    expect(style.height).toBeUndefined();
    expect(Number(style.minHeight)).toBeGreaterThan(0);
  });
});
