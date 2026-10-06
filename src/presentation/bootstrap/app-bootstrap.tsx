import '@presentation/bootstrap/crypto-polyfill';
import { t } from '@presentation/i18n';
import { StoreStatus } from '@application/store/store-status';
import { type ReactNode, useEffect } from 'react';
import { timerStore } from '@application/timers/timer-store';
import { timersBarStore } from '@presentation/base/timers/timers-bar-store';
import { onboardingStore } from '@application/onboarding/onboarding-store';
import { getNotificationService } from '@application/notifications/get-notification-service';
import { initFirebase } from '@infrastructure/firebase/firebase-init';
import { reportDeviceProfile } from '@infrastructure/device/report-device-profile';
import { logCrashBreadcrumb, recordCrash } from '@infrastructure/firebase/crashlytics-service';
import { AppErrorBoundary } from '@presentation/base/widgets/feedback/app-error-boundary';
import { analyticsService } from '@infrastructure/firebase/analytics-service';
import { AnalyticsEvent } from '@infrastructure/constants/analytics/analytics-event';
import { FailureReporter } from '@presentation/base/errors/failure-reporter';
import { container } from '@core/di/container';
import { TOKENS } from '@application/di/tokens';
import { registerInfrastructure } from '@infrastructure/di/register';
import { registerApplication } from '@application/di/register';
import type { RegisterDeviceTokenUseCase } from '@application/notifications/register-device-token-use-case';
import { StoresProvider } from '@presentation/bootstrap/stores-context';
import type { StoresType } from '@presentation/bootstrap/stores';
import { AppSyncs } from '@presentation/bootstrap/app-syncs';
import { registerPushToken } from '@infrastructure/notifications/push-token-registrar';
import { setPushRegistrationHandler } from '@application/notifications/ensure-push-registration';
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
const initializeStores = (): StoresType => {
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
  // Start hydration early but do not gate rendering on it: requests await it, the static export must still render.
  useEffect(() => {
    // Never rejects (falls back to the device seed). Presentation cannot import infrastructure, so the root hands it the sink.
    FailureReporter.setSink(recordCrash);
    FailureReporter.setTrailSink(logCrashBreadcrumb);
    // Count every shown failure, crash-worthy or not.
    FailureReporter.setEventSink((code, context) => {
      void analyticsService.logEvent(AnalyticsEvent.failureShown, { code, context });
    });
    void hydrateLocale();
    void initFirebase();
    // After Firebase, once per launch.
    reportDeviceProfile();
    stores.authStore.getState().hydrate().catch((err: unknown) => {
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
    void timersBarStore.getState().hydrate().catch(() => undefined);
    void onboardingStore.getState().hydrate();
  }, []);

  // Register the push token once signed in (Android FCM, web Firebase JS; iOS pending).
  useEffect(() => {
    let registered = false;
    const register = (): void => {
      if (stores.authStore.getState().state.status !== StoreStatus.Authenticated) return;
      registered = true;
      const useCase = container.resolve<RegisterDeviceTokenUseCase>(
        TOKENS.RegisterDeviceTokenUseCase,
      );
      void registerPushToken((token, platform) => useCase.execute(token, platform));
    };
    // Exposed so a screen that promises a notification can retry after permission is granted.
    const maybeRegister = (): void => {
      if (registered) return;
      register();
    };
    setPushRegistrationHandler(register);
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
