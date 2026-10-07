import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import { renderComponent } from '@presentation/base/test-support/render-component';
import { TickBox } from '@presentation/base/widgets/inputs/tick-box';

const boxStyle = (root: ReturnType<typeof renderComponent>['root']): ViewStyle =>
  StyleSheet.flatten(root.findAllByType(View)[0].props.style as ViewStyle);

describe('TickBox', () => {
  it('draws a tick on a filled box when checked', () => {
    const { root } = renderComponent(<TickBox checked />);

    expect(root.findAllByType(Ionicons).map((icon) => icon.props.name)).toEqual(['checkmark']);
    expect(boxStyle(root).backgroundColor).toBe(boxStyle(root).borderColor);
  });

  it('leaves an empty, outlined box when not checked', () => {
    const { root } = renderComponent(<TickBox checked={false} />);

    expect(root.findAllByType(Ionicons)).toHaveLength(0);
    expect(boxStyle(root).backgroundColor).not.toBe(boxStyle(root).borderColor);
  });
});
