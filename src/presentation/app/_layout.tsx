import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, usePathname } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import { ShareIntentProvider } from 'expo-share-intent';
import { useInstagramShareImport } from '@presentation/navigation/use-instagram-share-import';
import { AppBootstrap } from '@presentation/bootstrap/app-bootstrap';
import { AppThemeProvider } from '@presentation/base/theme/context/theme-context';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { zIndices } from '@presentation/base/theme';
import { LayoutProvider } from '@presentation/base/responsive/layout-context';
import { useLayout } from '@presentation/base/responsive/use-layout';
import { WebShellStateProvider } from '@presentation/base/web-shell/web-shell-state';
import { ActiveTimersBar } from '@presentation/base/widgets/timers/active-timers-bar';
import { ToastHost } from '@presentation/base/feedback/toast-host';
import { SplashOverlay } from '@presentation/base/widgets/loading/splash-overlay';
import { WebHeader } from '@presentation/base/widgets/web-header/web-header';
import { TabBar } from '@presentation/base/widgets/navigation/tab-bar';
import { AlarmScreen } from '@presentation/navigation/alarm-screen';
import { useAuthGuard } from '@presentation/navigation/use-auth-guard';
import { useTabBarState } from '@presentation/navigation/use-tab-bar-state';
import { alarmStore } from '@application/timers/alarm-store';

/** Full-screen overlay that appears whenever `alarmStore` has an active alarm. */
const AlarmOverlay = (): React.JSX.Element | null => {
  const activeAlarm = alarmStore((s) => s.activeAlarm);
  if (activeAlarm === null) return null;
  return (
    // zIndex must exceed ActiveTimersBar (100) so the alarm sits on top.
    <View style={[StyleSheet.absoluteFillObject, { zIndex: zIndices.alarmOverlay }]}>
      <AlarmScreen timerId={activeAlarm.timerId} recipeName={activeAlarm.recipeName} />
    </View>
  );
};

/**
 * Screens that own their own split-pane chrome (the auth flow plus the index
 * splash) and must NOT show the sticky WebHeader. Deliberately its own set —
 * NOT the auth guard's PUBLIC_PATHS: "reachable without a session" and
 * "renders without the header" are different concerns, and reusing the guard
 * set made the header vanish from /recipes when guest browsing made that
 * route public.
 */
const HEADERLESS_PATHS = new Set<string>([
  '/',
  '/onboarding',
  '/login',
  '/register',
  '/verify-code',
  '/forgot-password',
  '/reset-password',
]);

/**
 * Decides whether the sticky WebHeader should render. Auth screens own their
 * own split-pane chrome and skip the header. Everything else uses it as soon
 * as the LayoutProvider switches into the web shell breakpoint.
 */
const useShouldRenderWebHeader = (): boolean => {
  const { isWebShell } = useLayout();
  const pathname = usePathname();
  if (!isWebShell) return false;
  return !HEADERLESS_PATHS.has(pathname);
};

const WebShellChrome = (): React.JSX.Element | null => {
  const show = useShouldRenderWebHeader();
  if (!show) return null;
  return <WebHeader />;
};

/**
 * The one and only mobile TabBar, hosted below the Stack so screen
 * transitions animate the content area above it. Visibility and the active
 * tab are pathname-driven: on tab-less routes (detail pages, create flows,
 * auth screens, …) the bar does not render at all — no collapse animation.
 * The TabBar widget additionally hides itself on the web-shell breakpoint.
 */
const RootTabBar = (): React.JSX.Element | null => {
  const state = useTabBarState();
  if (state === null) return null;
  return <TabBar active={state.active} onChange={state.onChange} />;
};

const RootStack = (): React.JSX.Element => {
  const { scheme, colors } = useTheme();
  useAuthGuard();
  useInstagramShareImport();

  const reactNavTheme = scheme === 'dark' ? DarkTheme : DefaultTheme;
  const headerBg = colors.background;
  const headerTint = colors.text;

  return (
    <ThemeProvider value={reactNavTheme}>
      <WebShellChrome />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: headerBg },
          headerTintColor: headerTint,
          headerShadowVisible: false,
        }}
      >
        {/* Folder pages register on the parent navigator under their full
            relative name (`<segment>/index`) — a bare `<segment>` here would
            not match any route, so its options (headerShown:false) would be
            silently dropped and the default stack header would appear. */}
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding/index" options={{ headerShown: false }} />
        <Stack.Screen name="login/index" options={{ headerShown: false }} />
        <Stack.Screen name="register/index" options={{ headerShown: false }} />
        <Stack.Screen name="verify-code/index" options={{ headerShown: false }} />
        <Stack.Screen name="recipes/index" options={{ headerShown: false }} />
        <Stack.Screen name="recipes/[recipeId]/index" options={{ headerShown: false }} />
        <Stack.Screen name="my-recipes/index" options={{ headerShown: false }} />
        <Stack.Screen name="create-recipe/index" options={{ headerShown: false }} />
        <Stack.Screen name="settings/index" options={{ headerShown: false }} />
        <Stack.Screen name="forgot-password/index" options={{ headerShown: false }} />
        <Stack.Screen name="reset-password/index" options={{ headerShown: false }} />
        <Stack.Screen name="ai-generate/index" options={{ headerShown: false }} />
        <Stack.Screen name="notifications/index" options={{ headerShown: false }} />
        <Stack.Screen name="profile/index" options={{ headerShown: false }} />
        <Stack.Screen name="edit-profile/index" options={{ headerShown: false }} />
      </Stack>
      <RootTabBar />
      <ActiveTimersBar />
      <ToastHost />
      <AlarmOverlay />
      <SplashOverlay />
      <StatusBar style="auto" />
    </ThemeProvider>
  );
};

export const RootLayout = (): React.JSX.Element => {
  return (
    <ShareIntentProvider>
      <AppThemeProvider>
        <LayoutProvider>
          <WebShellStateProvider>
            <AppBootstrap>
              <RootStack />
            </AppBootstrap>
          </WebShellStateProvider>
        </LayoutProvider>
      </AppThemeProvider>
    </ShareIntentProvider>
  );
};

export default RootLayout;
