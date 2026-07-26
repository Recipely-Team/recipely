import type { ReactElement } from 'react';
import { act, create, type ReactTestInstance, type ReactTestRenderer } from 'react-test-renderer';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppThemeProvider } from '@presentation/base/theme/context/theme-context';
import type { RenderResult } from '@presentation/base/test-support/render-result';
import { CharConstants, ValueConstants } from '@core/constants';

/** Fixed safe-area metrics so layout-dependent components render deterministically. */
const SAFE_AREA_METRICS = {
  frame: { x: ValueConstants.zero, y: ValueConstants.zero, width: 320, height: 640 },
  insets: { top: ValueConstants.zero, left: ValueConstants.zero, right: ValueConstants.zero, bottom: ValueConstants.zero },
} as const;

/**
 * Renders a presentation component inside the providers it depends on (theme +
 * safe area) using react-test-renderer wrapped in `act`. Keeps the harness
 * identical across the mobile-home component suites.
 */
export const renderComponent = (element: ReactElement): RenderResult => {
  let renderer!: ReactTestRenderer;
  act(() => {
    renderer = create(
      <SafeAreaProvider initialMetrics={SAFE_AREA_METRICS}>
        <AppThemeProvider>{element}</AppThemeProvider>
      </SafeAreaProvider>,
    );
  });

  return { root: renderer.root, renderer };
};

/** The visible text of every `<Text>` node under `root` (blank nodes dropped). */
export const textContent = (root: ReactTestInstance): string[] =>
  root
    .findAllByType('Text')
    .map((node: ReactTestInstance) =>
      node.children.filter((child): child is string => typeof child === 'string').join(CharConstants.empty),
    )
    .filter((text: string) => text.length > ValueConstants.zero);

/** The single instance whose `accessibilityRole` matches, e.g. a pressable button. */
export const byRole = (root: ReactTestInstance, role: string): ReactTestInstance =>
  root.find((node: ReactTestInstance) => node.props.accessibilityRole === role);

/** Every instance whose `testID` matches — for asserting presence/absence of a node. */
export const allByTestId = (root: ReactTestInstance, testID: string): ReactTestInstance[] =>
  root.findAll((node: ReactTestInstance) => node.props.testID === testID);
