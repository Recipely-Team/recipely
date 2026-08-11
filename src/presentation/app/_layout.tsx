import { useMemo } from 'react';
import { ThemeProvider } from '@react-navigation/native';
import { Stack, usePathname } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import { ShareIntentProvider } from 'expo-share-intent';
import { useInstagramShareImport } from '@presentation/navigation/use-instagram-share-import';
import { usePushNotificationTap } from '@presentation/base/hooks/notifications/use-push-notification-tap';
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
import { navigationTheme } from '@presentation/navigation/navigation-theme';
import { useTabBarState } from '@presentation/navigation/use-tab-bar-state';
import { useWindowBackground } from '@presentation/navigation/use-window-background';
import { alarmStore } from '@application/timers/alarm-store';
import { ValueConstants } from '@core/constants';

/**
 * Full-screen overlay for the alarm at the head of the queue.
 *
 * Alarms are dismissed one at a time: when two timers finish together,
 * dismissing the first hands the screen to the second instead of leaving it
 * ringing with no way to reach it. `key` matters — it remounts `AlarmScreen`
 * for the next alarm so its tone and haptics start again rather than carrying
 * over the dismissed one's.
 */
const AlarmOverlay = (): React.JSX.Element | null => {
  const alarm = alarmStore((s) => s.alarms[ValueConstants.zero]);
  if (alarm === undefined) return null;
  return (
    // zIndex must exceed ActiveTimersBar (100) so the alarm sits on top.
    <View style={[StyleSheet.absoluteFill, { zIndex: zIndices.alarmOverlay }]}>
      <AlarmScreen key={alarm.timerId} timerId={alarm.timerId} recipeName={alarm.recipeName} />
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

/**
 * The three bottom-tab destinations swap instantly. `animation: 'none'` also
 * covers the way back to them, which is what keeps a tab press from reading as
 * a push in one direction and a pop in the other.
 */
const TAB_SCREEN_OPTIONS = { headerShown: false, animation: 'none' } as const;

const RootStack = (): React.JSX.Element => {
  const { scheme, colors } = useTheme();
  useAuthGuard();
  useInstagramShareImport();
  usePushNotificationTap();
  useWindowBackground(colors.background);

  const reactNavTheme = useMemo(() => navigationTheme(scheme, colors), [scheme, colors]);
  const headerBg = colors.background;
  const headerTint = colors.text;

  return (
    <ThemeProvider value={reactNavTheme}>
      {/* The tab bar is a sibling of the Stack and unmounts the moment the
          route becomes a tab-less one, while the stack transition is still
          running. Without a painted container the strip it vacated shows
          whatever is behind the app for the length of that animation —
          black on Android. `useWindowBackground` is the floor under this. */}
      <View style={[styles.root, { backgroundColor: colors.background }]}>
      <WebShellChrome />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: headerBg },
          headerTintColor: headerTint,
          headerShadowVisible: false,
          // Belt and braces with the theme above: `contentStyle` is what the
          // native stack paints a scene with, and a screen that renders nothing
          // on its first frame (a detail page waiting on its fetch) shows it
          // bare. Both must be the app's background or that frame is a flash.
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        {/* Folder pages register on the parent navigator under their full
            relative name (`<segment>/index`) — a bare `<segment>` here would
            not match any route, so its options (headerShown:false) would be
            silently dropped and the default stack header would appear.

            TAB_SCREEN_OPTIONS on the three tab destinations: a tab bar is a
            switch between peers, not a journey into a detail, so sliding one
            tab in over another borrowed a gesture that says "deeper". The
            screens that ARE pushed on top of a tab (a recipe, the editor, the
            auth flow) keep the stack animation. */}
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding/index" options={{ headerShown: false }} />
        <Stack.Screen name="login/index" options={{ headerShown: false }} />
        <Stack.Screen name="register/index" options={{ headerShown: false }} />
        <Stack.Screen name="verify-code/index" options={{ headerShown: false }} />
        <Stack.Screen name="recipes/index" options={TAB_SCREEN_OPTIONS} />
        <Stack.Screen name="recipes/[recipeId]/index" options={{ headerShown: false }} />
        <Stack.Screen name="my-recipes/index" options={TAB_SCREEN_OPTIONS} />
        <Stack.Screen name="create-recipe/index" options={{ headerShown: false }} />
        <Stack.Screen name="import-recipe/index" options={{ headerShown: false }} />
        <Stack.Screen name="settings/index" options={{ headerShown: false }} />
        <Stack.Screen name="forgot-password/index" options={{ headerShown: false }} />
        <Stack.Screen name="reset-password/index" options={{ headerShown: false }} />
        <Stack.Screen name="ai-generate/index" options={{ headerShown: false }} />
        <Stack.Screen name="notifications/index" options={{ headerShown: false }} />
        <Stack.Screen name="profile/index" options={TAB_SCREEN_OPTIONS} />
        <Stack.Screen name="edit-profile/index" options={{ headerShown: false }} />
      </Stack>
      <RootTabBar />
      <ActiveTimersBar />
      <ToastHost />
      <AlarmOverlay />
      <SplashOverlay />
      <StatusBar style="auto" />
      </View>
    </ThemeProvider>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1 },
});

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
