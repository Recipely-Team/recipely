import { useState, useSyncExternalStore as mockUseSyncExternalStore } from 'react';
import { Text, TextInput } from 'react-native';
import { act } from 'react-test-renderer';
import { allByTestId, renderComponent, textContent } from '@presentation/base/test-support/render-component';
import { HeroCardShell } from '@presentation/base/widgets/layout/hero-card-shell';

/**
 * Production web: on a desktop, text typed into the sign-in form in the first
 * few hundred ms vanished. The static export renders the stacked layout (it
 * knows no width); hydration then measured a wide window and the screen
 * returned a different tree for the split layout, so the form remounted.
 * Measured with Playwright on recipely.net/login at 1440 px: the inputs were
 * removed and re-added 326 ms after load.
 */
let mockIsSplit = false;
const mockListeners = new Set<() => void>();

jest.mock('@presentation/base/responsive/fold/use-two-pane-split', () => ({
  useTwoPaneSplit: () => ({
    isSplit: mockUseSyncExternalStore(
      (listener: () => void) => {
        mockListeners.add(listener);
        return () => mockListeners.delete(listener);
      },
      () => mockIsSplit,
    ),
    rowStyle: null,
    firstPaneStyle: null,
  }),
}));

const setSplit = (isSplit: boolean): void => {
  act(() => {
    mockIsSplit = isSplit;
    for (const listener of mockListeners) listener();
  });
};

const TypedField = (): React.JSX.Element => {
  const [value, setValue] = useState('');
  return <TextInput testID="field" value={value} onChangeText={setValue} />;
};

describe('HeroCardShell', () => {
  afterEach(() => {
    mockIsSplit = false;
  });

  it('keeps what the user typed when the layout switches from stacked to split', () => {
    const { root } = renderComponent(
      <HeroCardShell splitHero={<Text>split hero</Text>} stackedHeader={<Text>stacked hero</Text>} stackedCardStyle={null}>
        <TypedField />
      </HeroCardShell>,
    );
    act(() => {
      (allByTestId(root, 'field')[0]!.props['onChangeText'] as (text: string) => void)('cook@example.com');
    });

    setSplit(true);

    expect(textContent(root)).toContain('split hero');
    expect(allByTestId(root, 'field')[0]!.props['value']).toBe('cook@example.com');
  });

  it('keeps it when the layout switches back to stacked', () => {
    mockIsSplit = true;
    const { root } = renderComponent(
      <HeroCardShell splitHero={<Text>split hero</Text>} stackedHeader={<Text>stacked hero</Text>} stackedCardStyle={null}>
        <TypedField />
      </HeroCardShell>,
    );
    act(() => {
      (allByTestId(root, 'field')[0]!.props['onChangeText'] as (text: string) => void)('cook@example.com');
    });

    setSplit(false);

    expect(textContent(root)).toContain('stacked hero');
    expect(allByTestId(root, 'field')[0]!.props['value']).toBe('cook@example.com');
  });
});
