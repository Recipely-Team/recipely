/**
 * Reported from the web app: signing out opened a bottom sheet. A panel glued
 * to the bottom edge of a desktop window is a touch idiom — nothing reaches for
 * it there, and its grabber promises a drag a mouse never performs. Every sheet
 * in the app goes through this component, so the shell decides the
 * presentation here, once: sheet on mobile, centred dialog on web.
 */
/* eslint-disable import/first -- jest.mock() must be hoisted above imports */

let mockIsWebShell = false;

jest.mock('@presentation/base/responsive/use-layout', () => ({
  useLayout: () => ({ isWebShell: mockIsWebShell, width: mockIsWebShell ? 1280 : 390 }),
}));

import { act, type ReactTestInstance, type ReactTestRenderer } from 'react-test-renderer';
import { Modal, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { renderComponent } from '@presentation/base/test-support/render-component';
import { BottomSheet } from '@presentation/base/widgets/sheets/bottom-sheet';
import { ThemedText } from '@presentation/base/widgets/text/themed-text';
import { t } from '@presentation/i18n';

const render = (isWebShell: boolean): { root: ReactTestInstance; renderer: ReactTestRenderer } => {
  mockIsWebShell = isWebShell;
  return renderComponent(
    <BottomSheet visible title="Sheet title" onClose={jest.fn()}>
      <ThemedText>body</ThemedText>
    </BottomSheet>,
  );
};

/** Flattened style of the panel — the only child of the modal that has a radius. */
const panelStyle = (root: ReactTestInstance): ViewStyle => {
  const panel = root
    .findAll((node) => {
      const style = StyleSheet.flatten(node.props.style as StyleProp<ViewStyle>);
      return style?.borderRadius !== undefined || style?.borderTopLeftRadius !== undefined;
    })
    .at(0);
  if (panel === undefined) throw new Error('no panel rendered');
  return StyleSheet.flatten(panel.props.style as StyleProp<ViewStyle>) ?? {};
};

describe('BottomSheet — presentation per shell', () => {
  let renderer: ReactTestRenderer | undefined;

  afterEach(async () => {
    act(() => {
      renderer?.unmount();
    });
    renderer = undefined;
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });
  });

  it('is a bottom sheet on the mobile shell', () => {
    const rendered = render(false);
    renderer = rendered.renderer;

    expect(rendered.root.findByType(Modal).props.animationType).toBe('slide');
    // Anchored: rounded at the top only, sitting on the bottom edge.
    expect(panelStyle(rendered.root).borderTopLeftRadius).toBeGreaterThan(0);
    expect(panelStyle(rendered.root).borderRadius).toBeUndefined();
  });

  it('is a centred dialog on the web shell', () => {
    const rendered = render(true);
    renderer = rendered.renderer;

    expect(rendered.root.findByType(Modal).props.animationType).toBe('fade');
    // Free-floating: rounded all round and capped in width.
    expect(panelStyle(rendered.root).borderRadius).toBeGreaterThan(0);
    expect(panelStyle(rendered.root).maxWidth).toBeGreaterThan(0);
  });

  it('drops the drag grabber on web and shows a close button instead', () => {
    const web = render(true);
    renderer = web.renderer;

    // The grabber announces itself with the close hint; a mouse cannot drag it.
    const grabbers = web.root.findAll(
      (node) => node.props.accessibilityHint === t().common.closeHint,
    );
    expect(grabbers).toHaveLength(0);
    expect(
      web.root.findAll(
        (node) =>
          node.props.accessibilityRole === 'button' &&
          node.props.accessibilityLabel === t().common.close,
      ).length,
    ).toBeGreaterThan(0);
  });

  it('keeps the grabber on mobile, where it is the dismiss affordance', () => {
    const mobile = render(false);
    renderer = mobile.renderer;

    expect(
      mobile.root.findAll((node) => node.props.accessibilityHint === t().common.closeHint).length,
    ).toBeGreaterThan(0);
  });
});
