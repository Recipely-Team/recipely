import '@presentation/bootstrap/crypto-polyfill';
import { t } from '@presentation/i18n';
import { StoreStatus } from '@application/store/store-status';
import { type ReactNode, useEffect } from 'react';
import { timerStore } from '@application/timers/timer-store';
import { timersBarStore } from '@presentation/base/timers/timers-bar-store';
import { onboardingStore } from '@application/onboarding/onboarding-store';
import { getNotificationService } from '@application/notifications/get-notification-service';
import { initFirebase } from '@infrastructure/firebase/firebase-init';
import { recordCrash } from '@infrastructure/firebase/crashlytics-service';
import { AppErrorBoundary } from '@presentation/base/widgets/feedback/app-error-boundary';
import { logAnalyticsEvent } from '@infrastructure/firebase/analytics-service';
import { AnalyticsEvent } from '@infrastructure/constants/analytics';
import { FailureReporter } from '@presentation/base/errors/failure-reporter';
import { container } from '@core/di/container';
import { TOKENS } from '@application/di/tokens';
import { registerInfrastructure } from '@infrastructure/di/register';
import { registerApplication } from '@application/di/register';
import type { RegisterDeviceTokenUseCase } from '@application/notifications/register-device-token-use-case';
import { StoresProvider } from '@presentation/bootstrap/stores-context';
import type { Stores } from '@presentation/bootstrap/stores';
import { AppSyncs } from '@presentation/bootstrap/app-syncs';
import { registerPushToken } from '@infrastructure/notifications/push-token-registrar';
import { hydrateLocale } from '@presentation/i18n/i18n';

export interface AppBootstrapProps {
  children: ReactNode;
}

// WHY: infrastructure is registered BEFORE the stores exist, so the HTTP
// client's 401 hook can't reference the auth store directly. This mutable
// handler is read at call-time — once the stores are created we point it at
// `expireSession`, breaking the chicken-and-egg without infra importing
// application.
let onSessionExpired: () => void = () => {};

// Initialize stores synchronously on module load
const initializeStores = (): Stores => {
  registerInfrastructure(container, {
    onUnauthorized: () => onSessionExpired(),
  });
  const created = registerApplication(container);
  onSessionExpired = () => {
    void created.authStore.getState().expireSession();
  };
  return created;
};

const stores = initializeStores();

export const AppBootstrap = ({ children }: AppBootstrapProps): React.JSX.Element => {
  // WHY hydration is kicked off but NOT rendered around: the requests are what
  // must wait for the saved language, not the UI. Every request awaits the same
  // hydration through the HTTP client's async `localeProvider`, so the device
  // seed can never reach the backend — while the tree still renders on the
  // server for the static web export (a render gate here would emit blank pages).
  // Starting it early only means the UI re-renders in the saved language sooner.
  useEffect(() => {
    // Never rejects — a storage failure falls back to the device seed inside
    // LocaleService, because a rejection here would hang every request.
    // Fill the hole presentation declares: it may not reach into
    // infrastructure itself (rule 17), so the composition root hands it the
    // sink. Before this runs, reporting is a no-op — which is correct, since
    // Firebase is not initialised yet either.
    FailureReporter.setSink(recordCrash);
    // Every failure the user is shown is also COUNTED, whether or not it is
    // crash-worthy: a rise in handled network failures is a real signal, and it
    // has nowhere to live in Crashlytics.
    FailureReporter.setEventSink((code, context) => {
      void logAnalyticsEvent(AnalyticsEvent.failureShown, { code, context });
    });
    void hydrateLocale();
    void initFirebase();
    stores.authStore.getState().hydrate().catch((err: unknown) => {
      // `recordCrash` is the production channel (Crashlytics); the console line
      // only exists for local visibility, so it stays behind __DEV__ — an
      // unguarded console.error also raises a LogBox over the app in dev builds.
      if (__DEV__) console.error('[AppBootstrap] hydrate failed:', err);
      recordCrash(err, 'AppBootstrap.authStore.hydrate');
    });
    void getNotificationService().init({
      dismissAction: t().timer.notificationDismiss,
      channelName: t().timer.notificationChannel,
      timerDoneBody: t().timer.notificationBody,
    });
    timerStore.getState().hydrate().catch((err: unknown) => {
      if (__DEV__) console.error('[AppBootstrap] timer hydrate failed:', err);
      recordCrash(err, 'AppBootstrap.timerStore.hydrate');
    });
    // Restores whether the docked timers bar was left parked as a corner pill;
    // it defaults to expanded, so a storage failure is not worth reporting.
    void timersBarStore.getState().hydrate().catch(() => undefined);
    // Resolves the persisted "don't show onboarding again" choice so the launch
    // redirect can decide whether native guests land on the onboarding gate.
    void onboardingStore.getState().hydrate();
  }, []);

  // Register the device's push token once the user is authenticated (Android
  // via expo-notifications' FCM token, web via the Firebase JS SDK when
  // configured; iOS is still a no-op pending a native messaging module).
  useEffect(() => {
    let registered = false;
    const maybeRegister = (): void => {
      if (registered) return;
      if (stores.authStore.getState().state.status !== StoreStatus.Authenticated) return;
      registered = true;
      const useCase = container.resolve<RegisterDeviceTokenUseCase>(
        TOKENS.RegisterDeviceTokenUseCase,
      );
      void registerPushToken((token, platform) => useCase.execute(token, platform));
    };
    maybeRegister();
    return stores.authStore.subscribe(maybeRegister);
  }, []);

  return (
    <StoresProvider value={stores}>
      {/* The boundary lives HERE rather than in the root layout because it
          needs `recordCrash`, and only the composition root may reach into
          infrastructure (rule 17). It sits inside the providers so the screen
          it falls back to has the theme and stores it renders against. */}
      <AppErrorBoundary onError={recordCrash}>
        <AppSyncs stores={stores}>{children}</AppSyncs>
      </AppErrorBoundary>
    </StoresProvider>
  );
};
