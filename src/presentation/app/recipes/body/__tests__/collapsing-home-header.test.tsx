import { act, create, type ReactTestInstance } from 'react-test-renderer';
import { StyleSheet, TextInput, type StyleProp, type ViewStyle } from 'react-native';
import { useSharedValue } from 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  byRole,
  renderComponent,
  textContent,
} from '@presentation/base/test-support/render-component';
import type { RenderResult } from '@presentation/base/test-support/render-result';
import { AppThemeProvider } from '@presentation/base/theme/context/theme-context';
import { RecipelyLogo } from '@presentation/base/widgets/brand/recipely-logo';
import { CollapsingHomeHeader } from '@presentation/app/recipes/body/collapsing-home-header';
import { t } from '@presentation/i18n';

jest.mock('@expo/vector-icons', () => {
  const { Text } = jest.requireActual<typeof import('react-native')>('react-native');
  const Icon = (props: { name: string }): React.JSX.Element => <Text>{`icon:${props.name}`}</Text>;
  return { Ionicons: Icon, MaterialCommunityIcons: Icon };
});

interface HeaderOverrides {
  unreadCount?: number;
  searchValue?: string;
  reduceMotion?: boolean;
}

const renderHeader = (
  overrides: HeaderOverrides = {},
): {
  root: RenderResult['root'];
  onNotificationsPress: jest.Mock;
  onSearchChange: jest.Mock;
} => {
  const onNotificationsPress = jest.fn();
  const onSearchChange = jest.fn();

  const Probe = (): React.JSX.Element => {
    const scrollY = useSharedValue(0);
    const headerTranslateY = useSharedValue(0);
    return (
      <CollapsingHomeHeader
        scrollY={scrollY}
        headerTranslateY={headerTranslateY}
        reduceMotion={overrides.reduceMotion ?? true}
        onNotificationsPress={onNotificationsPress}
        unreadCount={overrides.unreadCount ?? 0}
        searchValue={overrides.searchValue ?? ''}
        onSearchChange={onSearchChange}
      />
    );
  };

  const { root } = renderComponent(<Probe />);
  return { root, onNotificationsPress, onSearchChange };
};

/** Recursively flattens a possibly-nested RN style prop into one object. */
const flattenStyle = (style: unknown): Record<string, unknown> =>
  Array.isArray(style)
    ? Object.assign({}, ...style.map(flattenStyle))
    : ((style as Record<string, unknown> | undefined) ?? {});

/**
 * Renders with an explicit top safe-area inset (bypassing the fixed
 * zero-inset metrics in `renderComponent`) so the band's resting `top` can be
 * asserted against a real device-like notch/status-bar value.
 */
const renderHeaderWithTopInset = (topInset: number): ReactTestInstance => {
  const Probe = (): React.JSX.Element => {
    const scrollY = useSharedValue(0);
    const headerTranslateY = useSharedValue(0);
    return (
      <CollapsingHomeHeader
        scrollY={scrollY}
        headerTranslateY={headerTranslateY}
        reduceMotion
        onNotificationsPress={jest.fn()}
        unreadCount={0}
        searchValue=""
        onSearchChange={jest.fn()}
      />
    );
  };

  let renderer!: ReturnType<typeof create>;
  act(() => {
    renderer = create(
      <SafeAreaProvider
        initialMetrics={{
          frame: { x: 0, y: 0, width: 320, height: 640 },
          insets: { top: topInset, left: 0, right: 0, bottom: 0 },
        }}
      >
        <AppThemeProvider>
          <Probe />
        </AppThemeProvider>
      </SafeAreaProvider>,
    );
  });
  return renderer.root;
};

/** The absolutely-positioned band (identified by its fixed zIndex). */
const bandStyle = (root: ReactTestInstance): Record<string, unknown> => {
  const node = root.findAll((n) => flattenStyle(n.props.style).zIndex === 20)[0];
  return flattenStyle(node?.props.style);
};

describe('CollapsingHomeHeader', () => {
  it('offsets the band by the top safe-area inset so it clears the status bar / notch', () => {
    const root = renderHeaderWithTopInset(47);

    expect(bandStyle(root).top).toBe(47);
  });

  it('does not add extra offset when there is no top inset (no-notch devices)', () => {
    const root = renderHeaderWithTopInset(0);

    expect(bandStyle(root).top).toBe(0);
  });


  it('renders the screen title from the recipes i18n namespace', () => {
    const { root } = renderHeader();

    expect(textContent(root)).toContain(t().recipes.title);
  });

  it('renders the logo eyebrow instead of the "Recipely" text', () => {
    const { root } = renderHeader();

    expect(textContent(root)).not.toContain('Recipely');
    expect(root.findAllByType(RecipelyLogo).length).toBeGreaterThan(0);
  });

  it('puts the mark on the same row as the title, not stacked above it', () => {
    const { root } = renderHeader();

    // Walk up from the logo to the first ancestor that also holds the title —
    // the container the two share. Stacked, that container is a column.
    let shared = root.findByType(RecipelyLogo).parent;
    while (shared !== null && !textContent(shared).includes(t().recipes.title)) {
      shared = shared.parent;
    }

    expect(shared).not.toBeNull();
    expect(StyleSheet.flatten(shared?.props.style as StyleProp<ViewStyle>)?.flexDirection).toBe('row');
  });

  it('renders a SearchBar wired to the search value and change handler', () => {
    const { root, onSearchChange } = renderHeader({ searchValue: 'pasta' });

    const input = root.findByType(TextInput);
    expect(input.props.value).toBe('pasta');
    expect(input.props.placeholder).toBe(t().recipes.searchPlaceholder);

    act(() => (input.props.onChangeText as (text: string) => void)('soup'));
    expect(onSearchChange).toHaveBeenCalledWith('soup');
  });

  it('fires onNotificationsPress when the bell is tapped', () => {
    const { root, onNotificationsPress } = renderHeader();

    act(() => (byRole(root, 'button').props.onPress as () => void)());

    expect(onNotificationsPress).toHaveBeenCalledTimes(1);
  });

  it('uses the outline bell icon and a plain label when there are no unread items', () => {
    const { root } = renderHeader({ unreadCount: 0 });

    expect(textContent(root)).toContain('icon:notifications-outline');
    expect(byRole(root, 'button').props.accessibilityLabel).toBe(t().notifications.title);
  });

  it('shows the unread badge count and the filled bell when unread > 0', () => {
    const { root } = renderHeader({ unreadCount: 4 });

    const texts = textContent(root);
    expect(texts).toContain('icon:notifications');
    expect(texts).toContain('4');
  });

  it('folds the unread count into the bell accessibility label', () => {
    const { root } = renderHeader({ unreadCount: 4 });

    expect(byRole(root, 'button').props.accessibilityLabel).toBe(`${t().notifications.title}, 4`);
  });

  it('caps the unread badge at "9+" while keeping the true count in the label', () => {
    const { root } = renderHeader({ unreadCount: 15 });

    const texts = textContent(root);
    expect(texts).toContain('9+');
    expect(texts).not.toContain('15');
    expect(byRole(root, 'button').props.accessibilityLabel).toBe(`${t().notifications.title}, 15`);
  });
});
