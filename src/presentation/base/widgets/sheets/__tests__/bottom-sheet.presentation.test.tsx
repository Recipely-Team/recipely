/**
 * Reported from the web app: signing out opened a bottom sheet. A panel glued
 * to the bottom edge of a desktop window is a touch idiom — nothing reaches for
 * it there, and its grabber promises a drag a mouse never performs. Every sheet
 * in the app goes through this component, so the VIEWPORT decides the
 * presentation here, once: sheet on a phone, centred dialog once expanded.
 *
 * The last case is the one that made this ask `isExpanded` rather than
 * `isWebShell`: an iPad is not the web shell, so it used to keep the phone's
 * bottom sheet — glued to the bottom edge of a 13" tablet.
 */
/* eslint-disable import/first -- jest.mock() must be hoisted above imports */

let mockIsExpanded = false;
let mockIsWebShell = false;

jest.mock('@presentation/base/responsive/use-layout', () => ({
  useLayout: () => ({
    isWebShell: mockIsWebShell,
    isExpanded: mockIsExpanded,
    width: mockIsExpanded ? 1280 : 390,
  }),
}));

import { act, type ReactTestInstance, type ReactTestRenderer } from 'react-test-renderer';
import { Modal, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { renderComponent } from '@presentation/base/test-support/render-component';
import { BottomSheet } from '@presentation/base/widgets/sheets/bottom-sheet';
import { ThemedText } from '@presentation/base/widgets/text/themed-text';
import { t } from '@presentation/i18n';

const render = (
  isExpanded: boolean,
  isWebShell: boolean = isExpanded,
): { root: ReactTestInstance; renderer: ReactTestRenderer } => {
  mockIsExpanded = isExpanded;
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

describe('BottomSheet — presentation per viewport', () => {
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

  it('is a bottom sheet on a phone', () => {
    const rendered = render(false);
    renderer = rendered.renderer;

    expect(rendered.root.findByType(Modal).props.animationType).toBe('slide');
    // Anchored: rounded at the top only, sitting on the bottom edge.
    expect(panelStyle(rendered.root).borderTopLeftRadius).toBeGreaterThan(0);
    expect(panelStyle(rendered.root).borderRadius).toBeUndefined();
  });

  it('is a centred dialog once the viewport is expanded', () => {
    const rendered = render(true);
    renderer = rendered.renderer;

    expect(rendered.root.findByType(Modal).props.animationType).toBe('fade');
    // Free-floating: rounded all round and capped in width.
    expect(panelStyle(rendered.root).borderRadius).toBeGreaterThan(0);
    expect(panelStyle(rendered.root).maxWidth).toBeGreaterThan(0);
  });

  it('drops the drag grabber when expanded and shows a close button instead', () => {
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

  // The regression this split exists for: a tablet is expanded but is NOT the
  // web shell, and used to fall through to the phone's bottom sheet.
  it('is a centred dialog on a tablet, which is not the web shell', () => {
    const tablet = render(true, false);
    renderer = tablet.renderer;

    expect(tablet.root.findByType(Modal).props.animationType).toBe('fade');
    expect(panelStyle(tablet.root).borderRadius).toBeGreaterThan(0);
    expect(panelStyle(tablet.root).maxWidth).toBeGreaterThan(0);
  });

  it('keeps the grabber on mobile, where it is the dismiss affordance', () => {
    const mobile = render(false);
    renderer = mobile.renderer;

    expect(
      mobile.root.findAll((node) => node.props.accessibilityHint === t().common.closeHint).length,
    ).toBeGreaterThan(0);
  });
});
