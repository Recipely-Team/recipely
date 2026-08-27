import type { ReactElement } from 'react';
import { isString } from '@core/guards/type-guards';
import { act, create, type ReactTestInstance, type ReactTestRenderer } from 'react-test-renderer';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppThemeProvider } from '@presentation/base/theme/context/theme-context';
import { AssistantActionRegistry } from '@application/assistant/actions/assistant-action-registry';
import { StoresProvider } from '@presentation/bootstrap/stores-context';
import type { Stores } from '@presentation/bootstrap/stores';
import type { RenderResult } from '@presentation/base/test-support/render-result';
import { CharConstants, ValueConstants } from '@core/constants';

/** Fixed safe-area metrics so layout-dependent components render deterministically. */
/** Viewport the harness pretends to render into — a 320×640 phone, the
 * narrowest layout the app supports, so a test that passes here passes wider. */
const TEST_FRAME_WIDTH = 320;
const TEST_FRAME_HEIGHT = 640;

const SAFE_AREA_METRICS = {
  frame: {
    x: ValueConstants.zero,
    y: ValueConstants.zero,
    width: TEST_FRAME_WIDTH,
    height: TEST_FRAME_HEIGHT,
  },
  insets: { top: ValueConstants.zero, left: ValueConstants.zero, right: ValueConstants.zero, bottom: ValueConstants.zero },
} as const;

/**
 * Renders a presentation component inside the providers it depends on (theme,
 * safe area and stores) using react-test-renderer wrapped in `act`.
 *
 * @remarks
 * - **Stores are provided by default because otherwise adopting an assistant
 *   hook breaks a screen's tests.** `useAssistantAction` reads `useStores`,
 *   which throws outside a provider, so every component that registered an
 *   assistant capability became unrenderable here — the reason only a handful
 *   of screens had adopted `useAssistantScrollable`. The cost of saying
 *   "the assistant can scroll this" should not be a red suite.
 * - **The bundle is a cast, not a real one.** Building the whole DI graph for
 *   a component test would drag in the HTTP client and storage; a component
 *   reads the one store it needs, so the harness supplies that one and lets a
 *   caller pass more.
 * - **A test wanting specific stores still wraps its own `StoresProvider`**
 *   inside `element` — the inner provider wins, so existing suites are
 *   unaffected.
 */
export const renderComponent = (element: ReactElement, stores?: Partial<Stores>): RenderResult => {
  let renderer!: ReactTestRenderer;
  const value = {
    assistantActionRegistry: new AssistantActionRegistry(),
    ...stores,
  } as unknown as Stores;

  act(() => {
    renderer = create(
      <SafeAreaProvider initialMetrics={SAFE_AREA_METRICS}>
        <AppThemeProvider>
          <StoresProvider value={value}>{element}</StoresProvider>
        </AppThemeProvider>
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
      node.children.filter((child): child is string => isString(child)).join(CharConstants.empty),
    )
    .filter((text: string) => text.length > ValueConstants.zero);

/** The single instance whose `accessibilityRole` matches, e.g. a pressable button. */
export const byRole = (root: ReactTestInstance, role: string): ReactTestInstance =>
  root.find((node: ReactTestInstance) => node.props.accessibilityRole === role);

/** Every instance whose `testID` matches — for asserting presence/absence of a node. */
export const allByTestId = (root: ReactTestInstance, testID: string): ReactTestInstance[] =>
  root.findAll((node: ReactTestInstance) => node.props.testID === testID);
