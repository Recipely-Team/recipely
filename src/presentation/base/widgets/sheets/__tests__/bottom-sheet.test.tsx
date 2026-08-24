/**
 * Behavior tests for the shared `BottomSheet`. Covers the two beta-reported
 * bugs: the grabber is now a real (if not fully simulate-able, see
 * `use-drag-to-dismiss.test.tsx`) dismiss control, and the redundant "×"
 * close button is hidden unless a consumer opts in via `showCloseButton`.
 */

import { useState } from 'react';
import { act } from 'react-test-renderer';
import { Modal, ScrollView, StyleSheet } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import { renderComponent, textContent } from '@presentation/base/test-support/render-component';
import type { RenderResult } from '@presentation/base/test-support/render-result';
import { ThemedText } from '@presentation/base/widgets/text/themed-text';
import { BottomSheet } from '@presentation/base/widgets/sheets/bottom-sheet';
import { t } from '@presentation/i18n';

/**
 * The explicit header "×" and the grabber both use role `button` + the same
 * "Close" label (the grabber is dismissible by plain tap too, not just
 * drag/VoiceOver) — `onPress` is what actually distinguishes them: the header
 * button is a real `Pressable` with `onPress`, while the grabber only wires
 * `onAccessibilityTap` (see `bottom-sheet.tsx`).
 */
const explicitCloseButton = (root: RenderResult['root']) =>
  root.findAll(
    (node) =>
      node.props.accessibilityRole === 'button' &&
      node.props.accessibilityLabel === t().common.close &&
      typeof node.props.onPress === 'function',
  )[0];

/** The node exposing `onAccessibilityTap` — the draggable grabber. */
const grabber = (root: RenderResult['root']) =>
  root.findAll((node) => typeof node.props.onAccessibilityTap === 'function')[0];

describe('BottomSheet', () => {
  it('hides the header close button by default, leaving the grabber as the only dismiss affordance beyond the backdrop', () => {
    const { root } = renderComponent(
      <BottomSheet visible title="Title" onClose={jest.fn()}>
        <ThemedText variant="body">content</ThemedText>
      </BottomSheet>,
    );

    expect(explicitCloseButton(root)).toBeUndefined();
    expect(grabber(root)).toBeDefined();
  });

  it('shows the explicit close button when showCloseButton is set, and it calls onClose', () => {
    const onClose = jest.fn();
    const { root } = renderComponent(
      <BottomSheet visible title="Title" onClose={onClose} showCloseButton>
        <ThemedText variant="body">content</ThemedText>
      </BottomSheet>,
    );

    const closeButton = explicitCloseButton(root);
    expect(closeButton).toBeDefined();
    act(() => (closeButton.props.onPress as () => void)());

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('dismisses via the grabber accessibility tap (VoiceOver double-tap equivalent)', () => {
    const onClose = jest.fn();
    const { root } = renderComponent(
      <BottomSheet visible title="Title" onClose={onClose}>
        <ThemedText variant="body">content</ThemedText>
      </BottomSheet>,
    );

    act(() => (grabber(root).props.onAccessibilityTap as () => void)());

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('still dismisses on a backdrop tap', () => {
    const onClose = jest.fn();
    const { root } = renderComponent(
      <BottomSheet visible title="Title" onClose={onClose}>
        <ThemedText variant="body">content</ThemedText>
      </BottomSheet>,
    );

    // The backdrop `Pressable` is wired directly to the `onClose` prop
    // (no intermediate handler), so it's the node whose `onPress` is that
    // exact function reference.
    const backdrop = root.findAll((node) => node.props.onPress === onClose)[0];
    act(() => (backdrop.props.onPress as () => void)());

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('renders a rightAction independent from onClose', () => {
    const onClose = jest.fn();
    const onPressRight = jest.fn();
    const { root } = renderComponent(
      <BottomSheet
        visible
        title="Title"
        onClose={onClose}
        rightAction={{ label: 'Clear', onPress: onPressRight }}
      >
        <ThemedText variant="body">content</ThemedText>
      </BottomSheet>,
    );

    expect(textContent(root)).toContain('Clear');
    const rightButton = root.findAll(
      (node) => node.props.accessibilityRole === 'button' && node.props.accessibilityLabel === 'Clear',
    )[0];
    act(() => (rightButton.props.onPress as () => void)());

    expect(onPressRight).toHaveBeenCalledTimes(1);
    expect(onClose).not.toHaveBeenCalled();
  });

  /**
   * The Android bug: the recipe filter sheet's "Show results" button sat at the
   * end of `children`, inside the scroll area. The sheet is capped at 78% of the
   * screen and the filter body is five chip sections tall, so the button lived
   * permanently below the fold — users reported not noticing it at all. `footer`
   * renders outside the ScrollView so it is reachable at any scroll position.
   */
  describe('pinned footer', () => {
    it('renders footer content outside the scroll area', () => {
      const { root } = renderComponent(
        <BottomSheet
          visible
          title="Title"
          onClose={jest.fn()}
          footer={<ThemedText variant="body">apply</ThemedText>}
        >
          <ThemedText variant="body">content</ThemedText>
        </BottomSheet>,
      );

      // The discriminating assertion: the footer node must have NO ScrollView
      // ancestor. Merely being rendered would also pass if it were appended to
      // `children`, which is the bug.
      const footerText = root
        .findAllByType(ThemedText)
        .find((node) => node.props.children === 'apply');
      expect(footerText).toBeDefined();

      const scrollViews = root.findAllByType(ScrollView);
      expect(scrollViews).not.toHaveLength(0);
      const insideScroll = scrollViews.some((scroll) =>
        scroll.findAllByType(ThemedText).some((node) => node.props.children === 'apply'),
      );
      expect(insideScroll).toBe(false);
    });

    it('lets the scroll area shrink so the footer keeps its height at the sheet cap', () => {
      const { root } = renderComponent(
        <BottomSheet
          visible
          title="Title"
          onClose={jest.fn()}
          footer={<ThemedText variant="body">apply</ThemedText>}
        >
          <ThemedText variant="body">content</ThemedText>
        </BottomSheet>,
      );

      // Without flexShrink the ScrollView claims its full content height and
      // pushes the footer past the sheet's bottom edge — the same invisible
      // button, just one layer down.
      const scroll = root.findAllByType(ScrollView)[0];
      expect(StyleSheet.flatten(scroll.props.style as StyleProp<ViewStyle>).flexShrink).toBe(1);
    });

    it('renders no footer container when a consumer passes none', () => {
      const { root } = renderComponent(
        <BottomSheet visible title="Title" onClose={jest.fn()}>
          <ThemedText variant="body">content</ThemedText>
        </BottomSheet>,
      );

      expect(textContent(root)).not.toContain('apply');
    });
  });
});

/**
 * Reported from the app: closing any sheet slid the dark layer down the screen
 * along with the panel, so for a fifth of a second the app was visible with a
 * receding shadow over it. The cause was `Modal`'s own `animationType="slide"`,
 * which moves the whole window — backdrop included. The scrim answers one
 * question, "is there something in front of this screen", and the moment the
 * answer is no it must stop being drawn.
 */
describe('BottomSheet — the scrim does not travel with the panel', () => {
  /** The absolutely-filled layer carrying the overlay colour. */
  const backdropOpacity = (root: RenderResult['root']): number => {
    const layer = root.findAll((node) => {
      const style = StyleSheet.flatten(node.props.style as StyleProp<ViewStyle>);
      return style?.position === 'absolute' && style?.backgroundColor !== undefined
        && style?.opacity !== undefined && style?.top === 0 && style?.left === 0;
    })[0];
    if (layer === undefined) throw new Error('no backdrop rendered');
    const style = StyleSheet.flatten(layer.props.style as StyleProp<ViewStyle>) ?? {};
    return (style.opacity as unknown as { __getValue: () => number }).__getValue();
  };

  /** Owns `visible` so the sheet closes the way a screen closes it: by re-render. */
  let close: () => void = () => undefined;
  const Harness = (): React.JSX.Element => {
    const [visible, setVisible] = useState(true);
    close = () => setVisible(false);
    return (
      <BottomSheet visible={visible} title="Title" onClose={jest.fn()}>
        <ThemedText variant="body">content</ThemedText>
      </BottomSheet>
    );
  };

  it('clears the dimming in the frame the sheet is dismissed, while the panel is still leaving', async () => {
    const { root, renderer } = renderComponent(<Harness />);
    // Long enough for the fade-in to finish, so what follows is a fall from
    // full dimming rather than from a value that had not arrived yet.
    await act(async () => {
      await new Promise((settle) => setTimeout(settle, 400));
    });
    expect(backdropOpacity(root)).toBeGreaterThan(0);

    act(() => close());

    // Not "on its way to zero" — zero, with the panel still on screen behind it.
    expect(backdropOpacity(root)).toBe(0);
    expect(root.findByType(Modal).props.visible).toBe(true);

    await act(async () => {
      await new Promise((settle) => setTimeout(settle, 400));
    });
    act(() => renderer.unmount());
  });
});
