import { act } from 'react-test-renderer';
import { useSharedValue } from 'react-native-reanimated';
import {
  byRole,
  renderComponent,
  textContent,
} from '@presentation/base/test-support/render-component';
import type { RenderResult } from '@presentation/base/test-support/render-result';
import { FilterSortFab } from '@presentation/app/recipes/items/filters/filter-sort-fab';
import { t } from '@presentation/i18n';

jest.mock('@expo/vector-icons', () => {
  const { Text } = jest.requireActual<typeof import('react-native')>('react-native');
  const Icon = (props: { name: string }): React.JSX.Element => <Text>{`icon:${props.name}`}</Text>;
  return { Ionicons: Icon, MaterialCommunityIcons: Icon };
});

interface FabCase {
  activeCount: number;
  reduceMotion?: boolean;
}

/** Recursively flattens a possibly-nested RN style prop into one object. */
const flattenStyle = (style: unknown): Record<string, unknown> => {
  if (typeof style === 'function') {
    return flattenStyle((style as (s: { pressed: boolean }) => unknown)({ pressed: false }));
  }
  return Array.isArray(style)
    ? Object.assign({}, ...style.map(flattenStyle))
    : ((style as Record<string, unknown> | undefined) ?? {});
};

/** The animated wrapper host node around the label text (the overflow-hidden box). */
const labelWrapper = (root: RenderResult['root']): Record<string, unknown> => {
  const node = root.findAll(
    (n) => flattenStyle(n.props.style).overflow === 'hidden' && 'marginLeft' in flattenStyle(n.props.style),
  )[0];
  return flattenStyle(node?.props.style);
};

const renderFab = (props: FabCase): { onPress: jest.Mock; root: RenderResult['root'] } => {
  const onPress = jest.fn();

  const Probe = (): React.JSX.Element => {
    const scrollY = useSharedValue(0);
    return (
      <FilterSortFab
        scrollY={scrollY}
        reduceMotion={props.reduceMotion ?? true}
        activeCount={props.activeCount}
        onPress={onPress}
      />
    );
  };

  const { root } = renderComponent(<Probe />);
  return { onPress, root };
};

describe('FilterSortFab', () => {
  it('renders the "Filter & Sort" label from the i18n key', () => {
    const { root } = renderFab({ activeCount: 0 });

    expect(textContent(root)).toContain(t().recipes.filtersAndSort);
  });

  it('exposes a button role with an accessibility label', () => {
    const { root } = renderFab({ activeCount: 0 });

    const btn = byRole(root, 'button');

    expect(btn.props.accessibilityRole).toBe('button');
    expect(btn.props.accessibilityLabel).toBe(t().recipes.filtersAndSort);
  });

  it('fires onPress when the FAB is pressed', () => {
    const { root, onPress } = renderFab({ activeCount: 0 });

    act(() => (byRole(root, 'button').props.onPress as () => void)());

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('hides the count badge when there are no active filters', () => {
    const { root } = renderFab({ activeCount: 0 });

    const texts = textContent(root);
    expect(texts).toContain(t().recipes.filtersAndSort);
    expect(texts.some((text) => /^\d/.test(text))).toBe(false);
  });

  it('shows the active count in the badge when filters are applied', () => {
    const { root } = renderFab({ activeCount: 3 });

    expect(textContent(root)).toContain('3');
  });

  it('folds the count into the accessibility label when filters are applied', () => {
    const { root } = renderFab({ activeCount: 3 });

    expect(byRole(root, 'button').props.accessibilityLabel).toBe(`${t().recipes.filtersAndSort}, 3`);
  });

  it('caps the badge text at "9+" for large counts', () => {
    const { root } = renderFab({ activeCount: 12 });

    const texts = textContent(root);
    expect(texts).toContain('9+');
    expect(texts).not.toContain('12');
  });

  it('keeps the real count (not the capped badge) in the accessibility label', () => {
    const { root } = renderFab({ activeCount: 12 });

    expect(byRole(root, 'button').props.accessibilityLabel).toBe(`${t().recipes.filtersAndSort}, 12`);
  });

  it('always renders the funnel icon so the collapsed circle is never blank', () => {
    const { root } = renderFab({ activeCount: 0, reduceMotion: false });

    expect(textContent(root)).toContain('icon:funnel-outline');
  });

  it('wraps the label in an overflow-hidden box so its width can collapse to 0', () => {
    const { root } = renderFab({ activeCount: 0, reduceMotion: false });

    expect(labelWrapper(root).overflow).toBe('hidden');
  });

  it('centers the row and drives icon/label spacing via the collapsible margin, not a flex gap', () => {
    const { root } = renderFab({ activeCount: 0, reduceMotion: false });

    const rowStyle = flattenStyle(byRole(root, 'button').props.style);

    // justifyContent: center keeps the lone icon centered once the label width
    // collapses; the gap must be gone or it would offset the icon by gap/2.
    expect(rowStyle.justifyContent).toBe('center');
    expect(rowStyle.gap).toBeUndefined();
    // Spacing now lives on the label wrapper's animatable marginLeft instead.
    expect(labelWrapper(root).marginLeft).toBeGreaterThan(0);
  });
});
