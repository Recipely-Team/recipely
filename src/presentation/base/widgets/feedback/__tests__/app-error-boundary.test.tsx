/**
 * A render-time throw used to take the whole app with it: in a release build
 * that is not a red screen, it is an app that goes white or closes — and told
 * us nothing, because Crashlytics never heard about it.
 */

import { Text } from 'react-native';
import { renderComponent, textContent } from '@presentation/base/test-support/render-component';
import { AppErrorBoundary } from '@presentation/base/widgets/feedback/app-error-boundary';
import { t } from '@presentation/i18n';

jest.mock('@expo/vector-icons', () => {
  const { Text: RNText } = jest.requireActual<typeof import('react-native')>('react-native');
  const Icon = (props: { name: string }): React.JSX.Element => <RNText>{`icon:${props.name}`}</RNText>;
  return { Ionicons: Icon, MaterialCommunityIcons: Icon };
});

const Boom = (): React.JSX.Element => {
  throw new Error('render exploded');
};

describe('AppErrorBoundary', () => {
  // React logs the caught error; silenced so a passing run reads as passing.
  let consoleError: jest.SpyInstance;

  beforeEach(() => {
    consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    consoleError.mockRestore();
  });

  it('renders its children when nothing throws', () => {
    const { root } = renderComponent(
      <AppErrorBoundary onError={jest.fn()}>
        <Text>the app</Text>
      </AppErrorBoundary>,
    );

    expect(textContent(root)).toContain('the app');
  });

  it('shows a recoverable error state instead of an empty screen', () => {
    const { root } = renderComponent(
      <AppErrorBoundary onError={jest.fn()}>
        <Boom />
      </AppErrorBoundary>,
    );

    const texts = textContent(root);
    expect(texts).toContain(t().errors.unknown.title);
    // A way out. A dead end is what the crash already was.
    expect(texts).toContain(t().common.retry);
  });

  it('hands the crash to the reporter, with the component stack that says where', () => {
    const onError = jest.fn();

    renderComponent(
      <AppErrorBoundary onError={onError}>
        <Boom />
      </AppErrorBoundary>,
    );

    expect(onError).toHaveBeenCalledTimes(1);
    const [error, context] = onError.mock.calls[0] as [unknown, string];
    expect((error as Error).message).toBe('render exploded');
    expect(context).toContain('AppErrorBoundary');
  });
});
