/**
 * The mobile tab row has to seat four tabs on a phone. Two things it must not
 * lose: an empty tab stays quiet (no red "0" on Drafts the moment you open the
 * screen), and the count a screen reader hears is the true one — the badge caps
 * at "9+", so the label is where the real number lives.
 */

import type { ReactTestInstance } from 'react-test-renderer';
import { StyleSheet, type ViewStyle } from 'react-native';
import { renderComponent, textContent } from '@presentation/base/test-support/render-component';
import type { RenderResult } from '@presentation/base/test-support/render-result';
import { MyRecipesTabs } from '@presentation/app/my-recipes/body/my-recipes-tabs';
import type { MyRecipesTab } from '@presentation/app/my-recipes/model/my-recipes-tab';
import { TabType } from '@presentation/app/my-recipes/model/tab-type';

jest.mock('@expo/vector-icons', () => {
  const { Text } = jest.requireActual<typeof import('react-native')>('react-native');
  const Icon = (props: { name: string }): React.JSX.Element => <Text>{`icon:${props.name}`}</Text>;
  return { Ionicons: Icon, MaterialCommunityIcons: Icon };
});

const TABS: readonly MyRecipesTab[] = [
  { key: TabType.Saved, label: 'Saved', count: 3 },
  { key: TabType.Liked, label: 'Liked', count: 12 },
  { key: TabType.Created, label: 'Created', count: 1 },
  { key: TabType.Drafts, label: 'Drafts', count: 0 },
];

const render = (active: TabType = TabType.Saved, onChange = jest.fn()): RenderResult =>
  renderComponent(<MyRecipesTabs tabs={TABS} active={active} onChange={onChange} />);

interface TabProps {
  accessibilityLabel: string;
  accessibilityState: { selected: boolean };
  onPress: () => void;
}

const tabByLabel = (result: RenderResult, label: string): TabProps =>
  result.root.find(
    (node: ReactTestInstance) =>
      node.props.accessibilityRole === 'tab' &&
      String(node.props.accessibilityLabel).startsWith(label),
  ).props as unknown as TabProps;

describe('MyRecipesTabs', () => {
  it('renders every tab with its own glyph', () => {
    const texts = textContent(render().root);

    expect(texts).toContain('icon:bookmark-outline');
    expect(texts).toContain('icon:heart-outline');
    expect(texts).toContain('icon:silverware-fork-knife');
    expect(texts).toContain('icon:file-document-edit-outline');
  });

  it('badges each tab that has something behind it', () => {
    const texts = textContent(render().root);

    expect(texts).toContain('3');
    expect(texts).toContain('1');
  });

  it('leaves an empty tab unbadged rather than showing a red zero', () => {
    expect(textContent(render().root)).not.toContain('0');
  });

  it('shows a two-digit count in full — these are the user\'s own recipes, not an alert queue', () => {
    const result = render();

    expect(textContent(result.root)).toContain('12');
    expect(textContent(result.root)).not.toContain('9+');
    expect(tabByLabel(result, 'Liked').accessibilityLabel).toBe('Liked, 12');
  });

  it('marks only the active tab as selected', () => {
    const result = render(TabType.Liked);

    expect(tabByLabel(result, 'Liked').accessibilityState.selected).toBe(true);
    expect(tabByLabel(result, 'Saved').accessibilityState.selected).toBe(false);
  });

  it('reports the tab that was pressed', () => {
    const onChange = jest.fn();
    const result = render(TabType.Saved, onChange);

    tabByLabel(result, 'Created').onPress();

    expect(onChange).toHaveBeenCalledWith(TabType.Created);
  });

  // Reported: "bildirim sayısı iconu kaplıyor". The badge was anchored by its
  // RIGHT edge over the glyph, so a two-digit count grew leftward and sat on
  // top of the icon — covering the one thing that says which tab it is. It is
  // now anchored at the glyph's top-right CORNER and grows away from it.
  it('anchors the badge off the corner so a wider count grows away from the icon', () => {
    // Walk up from the count itself, so this cannot latch onto the underline —
    // the row's other absolutely-positioned box.
    const countText = render()
      .root.findAllByType('Text')
      .find((node: ReactTestInstance) => node.children.includes('12'));
    let badge: ReactTestInstance | null = countText?.parent ?? null;
    let style: ViewStyle = {};
    while (badge !== null) {
      style = (StyleSheet.flatten(badge.props.style as ViewStyle) ?? {}) as ViewStyle;
      if (style.position === 'absolute') break;
      badge = badge.parent;
    }

    expect(badge).not.toBeNull();

    expect(style.left).toBe('100%');
    expect(style.bottom).toBe('100%');
    // The bug: an anchor on the right edge pins the far side and widens inward.
    expect(style.right).toBeUndefined();
  });
});
