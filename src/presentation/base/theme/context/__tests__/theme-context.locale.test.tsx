/**
 * A language switch must repaint the app instantly. react-navigation blocks
 * parent-driven re-renders of mounted screens, so `AppThemeProvider` rebuilds
 * its context value when the locale changes — every `useTheme` consumer
 * (i.e. every screen) then re-renders and re-evaluates its `t()` strings.
 * This test locks that propagation path down: a component that renders a
 * `t()` string and consumes `useTheme` (but never calls `useLocale` itself)
 * must show the new language immediately after `setLocale`.
 */
import { act, create } from 'react-test-renderer';
import { Text } from 'react-native';
import { container } from '@core/di/container';
import { TOKENS } from '@application/di/tokens';
import { FakeKeyValueStore } from '@application/__fixtures__/fake-key-value-store';
import { AppThemeProvider } from '@presentation/base/theme/context/theme-context';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { t, setLocale } from '@presentation/i18n';

// Empty in-memory key-value store under the DI token so the provider and
// setLocale never hit the platform backend during this render/reactivity test.
const fakeKvStore = new FakeKeyValueStore();
container.register(TOKENS.KeyValueStore, () => fakeKvStore);

const flushMicrotasks = async (): Promise<void> => {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
};

/** Mimics a screen: consumes the theme, renders a t() string, no useLocale. */
const Probe = (): React.JSX.Element => {
  useTheme();
  return <Text>{t().settings.title}</Text>;
};

describe('AppThemeProvider locale reactivity', () => {
  afterEach(() => {
    act(() => setLocale('en'));
  });

  it('re-renders useTheme consumers so t() strings update on setLocale', async () => {
    act(() => setLocale('en'));
    const renderer = create(
      <AppThemeProvider>
        <Probe />
      </AppThemeProvider>,
    );
    await flushMicrotasks();

    const rendered = (): string => JSON.stringify(renderer.toJSON());
    const english = rendered();

    act(() => setLocale('tr'));
    await flushMicrotasks();

    expect(rendered()).not.toEqual(english);

    act(() => setLocale('en'));
    await flushMicrotasks();
    expect(rendered()).toEqual(english);

    renderer.unmount();
  });
});
