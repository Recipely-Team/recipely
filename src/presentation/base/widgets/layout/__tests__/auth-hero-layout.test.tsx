import { StyleSheet, Text } from 'react-native';
import { renderComponent } from '@presentation/base/test-support/render-component';
import { AuthHeroLayout } from '@presentation/base/widgets/layout/auth-hero-layout';
import { ThemedText } from '@presentation/base/widgets/text/themed-text';

/**
 * Review finding: the hero's title and subtitle sat in a box pinned to a fixed
 * `height` over a gradient of the same fixed height, so at a large font scale
 * (or in German / Russian) the subtitle spilled past the hero into the card.
 */
describe('AuthHeroLayout', () => {
  it('lets the hero holding the title and subtitle grow with its text (no fixed height)', () => {
    const { root } = renderComponent(
      <AuthHeroLayout icon="key-outline" title="Title" subtitle="Subtitle" backLabel="Back" onBack={jest.fn()}>
        <Text>form</Text>
      </AuthHeroLayout>,
    );
    const subtitle = root.findAllByType(ThemedText).find((node) => node.props.children === 'Subtitle');
    let node = subtitle?.parent ?? null;
    const boxes: Record<string, unknown>[] = [];
    while (node !== null) {
      const style = StyleSheet.flatten(node.props.style) as Record<string, unknown> | undefined;
      if (style !== undefined) boxes.push(style);
      node = node.parent;
    }

    expect(boxes.some((style) => style.minHeight !== undefined)).toBe(true);
    expect(boxes.filter((style) => typeof style.height === 'number')).toEqual([]);
  });
});
