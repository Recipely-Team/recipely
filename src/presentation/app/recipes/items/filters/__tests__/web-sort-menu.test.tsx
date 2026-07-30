/**
 * Behavior tests for the web-only sort dropdown.
 *
 * WebSortMenu is self-contained: it owns its open/close state and reads option
 * labels from `sortKeyLabels()` (i18n-backed). We drive it through its
 * accessibility surface — the trigger button (`accessibilityRole="button"`,
 * labelled with `recipes.sortBy`) and the option rows
 * (`accessibilityRole="menuitem"`, labelled with each sort label) — and assert
 * on rendered text + the `onChange` callback the parent relies on, never on
 * markup.
 */

import { act } from 'react-test-renderer';
import {
  renderComponent,
  textContent,
} from '@presentation/base/test-support/render-component';
import type { RenderResult } from '@presentation/base/test-support/render-result';
import { WebSortMenu } from '@presentation/app/recipes/items/filters/web-sort-menu';
import { sortKeyLabels } from '@presentation/app/recipes/model/recipe-sort';
import { SortKey } from '@presentation/app/recipes/model/sort-key';

// Render the icon as plain text so query helpers never trip over the native mock.
jest.mock('@expo/vector-icons', () => {
  const { Text } = jest.requireActual<typeof import('react-native')>('react-native');
  const Icon = (props: { name: string }): React.JSX.Element => <Text>{`icon:${props.name}`}</Text>;
  return { Ionicons: Icon, MaterialCommunityIcons: Icon };
});

const labels = sortKeyLabels();

const renderMenu = (
  current: SortKey = 'popular',
): { root: RenderResult['root']; onChange: jest.Mock } => {
  const onChange = jest.fn();

  const { root } = renderComponent(<WebSortMenu current={current} onChange={onChange} />);

  return { root, onChange };
};

/** The trigger button (the only node labelled with the sort-by label). */
const trigger = (root: RenderResult['root']): RenderResult['root'] =>
  root.find(
    (node) =>
      node.props.accessibilityRole === 'button' &&
      typeof node.props.onPress === 'function',
  );

/** Fires the menuitem whose accessibility label matches the given option label. */
const pressOption = (root: RenderResult['root'], label: string): void => {
  const item = root.find(
    (node) =>
      node.props.accessibilityRole === 'menuitem' && node.props.accessibilityLabel === label,
  );
  act(() => (item.props.onPress as () => void)());
};

const press = (node: RenderResult['root']): void => {
  act(() => (node.props.onPress as () => void)());
};

describe('WebSortMenu', () => {
  it("renders the trigger showing the current option's label", () => {
    const { root } = renderMenu('rating');

    expect(textContent(root)).toContain(labels.rating);
  });

  it('does not show other options until the trigger is pressed', () => {
    const { root } = renderMenu('popular');

    // A non-current option must be absent before opening.
    expect(textContent(root)).not.toContain(labels.newest);
  });

  it('reveals the options menu after the trigger is pressed', () => {
    const { root } = renderMenu('popular');

    press(trigger(root));

    expect(textContent(root)).toContain(labels.newest);
  });

  it('calls onChange with the selected option key', () => {
    const { root, onChange } = renderMenu('popular');

    press(trigger(root));
    pressOption(root, labels.time);

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith('time');
  });

  it('closes the menu when the open trigger is pressed again', () => {
    const { root } = renderMenu('popular');

    press(trigger(root));
    expect(textContent(root)).toContain(labels.newest);

    press(trigger(root));

    expect(textContent(root)).not.toContain(labels.newest);
  });

  it('closes the menu after an option is selected', () => {
    const { root } = renderMenu('popular');

    press(trigger(root));
    pressOption(root, labels.time);

    expect(textContent(root)).not.toContain(labels.newest);
  });
});
