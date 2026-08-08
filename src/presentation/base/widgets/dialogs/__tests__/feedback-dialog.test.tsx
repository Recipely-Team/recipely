/**
 * Behavior tests for the shared `FeedbackDialog`. Covers the content rendering,
 * the primary/secondary action wiring, the optional secondary action being
 * omitted entirely when not provided, and the danger severity variant.
 */

import { StyleSheet } from 'react-native';
import type { ViewStyle } from 'react-native';
import { act } from 'react-test-renderer';
import type { ReactTestInstance } from 'react-test-renderer';
import {
  renderComponent,
  textContent,
} from '@presentation/base/test-support/render-component';
import type { RenderResult } from '@presentation/base/test-support/render-result';
import { FeedbackDialog } from '@presentation/base/widgets/dialogs/feedback-dialog';
import { Ionicons } from '@expo/vector-icons';
import { t } from '@presentation/i18n';

const PRIMARY_LABEL = 'View recipe';
const SECONDARY_LABEL = 'Done';

const buttonByLabel = (root: RenderResult['root'], label: string) =>
  root.findAll(
    (node) =>
      node.props.accessibilityRole === 'button' &&
      node.props.accessibilityLabel === label &&
      typeof node.props.onPress === 'function',
  )[0];

const renderSheet = (overrides: Partial<React.ComponentProps<typeof FeedbackDialog>> = {}) =>
  renderComponent(
    <FeedbackDialog
      visible
      title="Recipe saved"
      message="Your recipe is now published."
      primaryLabel={PRIMARY_LABEL}
      onPrimary={jest.fn()}
      onClose={jest.fn()}
      {...overrides}
    />,
  );

describe('FeedbackDialog', () => {
  it('renders the title, message, and primary label when visible', () => {
    const { root } = renderSheet();

    const text = textContent(root);
    expect(text).toContain('Recipe saved');
    expect(text).toContain('Your recipe is now published.');
    expect(text).toContain(PRIMARY_LABEL);
  });

  it('calls onPrimary when the primary action is pressed', () => {
    const onPrimary = jest.fn();
    const { root } = renderSheet({ onPrimary });

    act(() => (buttonByLabel(root, PRIMARY_LABEL).props.onPress as () => void)());

    expect(onPrimary).toHaveBeenCalledTimes(1);
  });

  it('calls onSecondary when the secondary action is pressed', () => {
    const onSecondary = jest.fn();
    const { root } = renderSheet({
      secondaryLabel: SECONDARY_LABEL,
      onSecondary,
    });

    act(() => (buttonByLabel(root, SECONDARY_LABEL).props.onPress as () => void)());

    expect(onSecondary).toHaveBeenCalledTimes(1);
  });

  it('omits the secondary action when no label is provided', () => {
    const { root } = renderSheet();

    expect(buttonByLabel(root, SECONDARY_LABEL)).toBeUndefined();
  });

  it('renders a checkmark disc by default and an alert disc for danger', () => {
    // The ✕ is an icon too, so the disc is the one that is NOT the close mark —
    // addressing it by position would break the next time the order changes.
    const discIcon = (r: ReturnType<typeof renderSheet>): string | undefined =>
      r.root
        .findAllByType(Ionicons)
        .map((node) => String(node.props.name))
        .find((name) => name !== 'close');

    expect(discIcon(renderSheet())).toBe('checkmark');
    expect(discIcon(renderSheet({ severity: 'danger' }))).toBe('alert');
  });

  /**
   * The dialog reports an outcome; the one thing a user must always be able to
   * do is leave. That used to be a second button labelled "OK" sitting under
   * the real action — which made the user choose between two ways to do
   * nothing. Leaving is the ✕ now, and the action row is only for actions.
   */
  it('always offers a way out, even with a single action', () => {
    const onClose = jest.fn();
    const { root } = renderSheet({ onClose });

    const close = buttonByLabel(root, t().common.close);
    expect(close).toBeDefined();

    (close?.props.onPress as () => void)();
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('puts two actions side by side rather than stacking them', () => {
    // Peers, not a primary with an escape hatch beneath it.
    const { root } = renderSheet({ secondaryLabel: SECONDARY_LABEL, onSecondary: jest.fn() });

    const primary = buttonByLabel(root, PRIMARY_LABEL);
    const secondary = buttonByLabel(root, SECONDARY_LABEL);
    expect(primary).toBeDefined();
    expect(secondary).toBeDefined();

    // Both stretch to equal halves of the same row. `Pressable.style` is a
    // FUNCTION of the press state, so it has to be resolved before flattening.
    const flexOf = (node: ReactTestInstance | undefined): unknown => {
      const style = node?.props.style as
        | ViewStyle
        | ((state: { pressed: boolean }) => ViewStyle)
        | undefined;
      const resolved = typeof style === 'function' ? style({ pressed: false }) : style;
      return (StyleSheet.flatten(resolved) as ViewStyle | undefined)?.flex;
    };
    expect(flexOf(primary)).toBe(1);
    expect(flexOf(secondary)).toBe(1);
  });
});
