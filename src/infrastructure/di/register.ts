import { type Container } from '@core/di/container';
import { TOKENS } from '@application/di/tokens';
import { HttpClient } from '@infrastructure/network/http/http-client';
import type { HttpClientOptions } from '@infrastructure/network/http/http-client-options';
import { SecureTokenStorage } from '@infrastructure/storage/secure-token-storage';
import { AuthRepository } from '@infrastructure/auth/auth-repository';
import { RecipeRepository } from '@infrastructure/recipes/recipe-repository';
import { TaxonomyRepository } from '@infrastructure/recipes/taxonomy/taxonomy-repository';
import { LoadTaxonomyUseCase } from '@application/recipes/taxonomy/load-taxonomy-use-case';
import { RecipeDraftRepository } from '@infrastructure/drafts/recipe-draft-repository';
import { FavoritesRepository } from '@infrastructure/favorites/favorites-repository';
import { FoodDiaryRepository } from '@infrastructure/diary/food-diary-repository';
import { FoodCatalogRepository } from '@infrastructure/diary/foods/food-catalog-repository';
import { InstagramRepository } from '@infrastructure/instagram/instagram-repository';
import { AddFavoriteUseCase } from '@application/favorites/add-favorite-use-case';
import { RemoveFavoriteUseCase } from '@application/favorites/remove-favorite-use-case';
import { LoadFavoritesUseCase } from '@application/favorites/load-favorites-use-case';
import { CommentRepository } from '@infrastructure/comments/comment-repository';
import { LikeRepository } from '@infrastructure/likes/like-repository';
import { LikeRecipeUseCase } from '@application/likes/like-recipe-use-case';
import { UnlikeRecipeUseCase } from '@application/likes/unlike-recipe-use-case';
import { LoadLikedRecipesUseCase } from '@application/likes/load-liked-recipes-use-case';
import { NotificationRepository } from '@infrastructure/notifications/notification-repository';
import { UserProfileRepository } from '@infrastructure/user-profile/user-profile-repository';
import { ListNotificationsUseCase } from '@application/notifications/list/list-notifications-use-case';
import { MarkAllReadUseCase } from '@application/notifications/read/mark-all-read-use-case';
import { MarkOneReadUseCase } from '@application/notifications/read/mark-one-read-use-case';
import { RegisterDeviceTokenUseCase } from '@application/notifications/register-device-token-use-case';
import { GetUserProfileUseCase } from '@application/user-profile/get-user-profile-use-case';
import { FeedbackRepository } from '@infrastructure/feedback/feedback-repository';
import { FeatureFlagRepository } from '@infrastructure/flags/feature-flag-repository';
import { FeatureFlagResolver } from '@application/config/feature-flag-resolver';
import type { FeatureFlagRepositoryInterface } from '@domain/flags/feature-flag-repository-interface';
import { IS_DEV_BUILD } from '@infrastructure/constants/app-variant';
import { SubmitFeedbackUseCase } from '@application/feedback/submit-feedback-use-case';
import { kvStore } from '@infrastructure/storage/kv-store';
import { NotificationService } from '@infrastructure/notifications/notification-service';
import { AlarmAudioService } from '@infrastructure/audio/alarm-audio-service';
import { AdsService } from '@infrastructure/ads/ads-service';
import { OsAssistantBridge } from '@infrastructure/assistant/os/os-assistant-bridge';
import { WindowPostureBridge } from '@infrastructure/display/window-posture-bridge';
import { AssistantMessenger } from '@infrastructure/assistant/message/assistant-messenger';
import { AssistantTokenRepository } from '@infrastructure/assistant/token/assistant-token-repository';
import { GeminiLiveSession } from '@live-assistant/gemini';
import { Microphone, PcmPlayer } from '@live-assistant/audio';
import { ExpoDeviceLocaleProvider } from '@infrastructure/i18n/expo-device-locale-provider';
import { LocaleService } from '@application/i18n/locale-service';
import type { DeviceLocaleProviderInterface } from '@domain/i18n/device-locale-provider-interface';
import type { KeyValueStoreInterface } from '@domain/storage/key-value-store-interface';

import { randomUUID } from 'expo-crypto';
import Constants from 'expo-constants';
import { StoredDeviceIdentity } from '@infrastructure/device/stored-device-identity';
import { DeviceRepository } from '@infrastructure/device/device-repository';
import { currentDevicePlatform } from '@infrastructure/device/current-device-platform';
import type { DeviceIdentityInterface } from '@domain/device/device-identity-interface';
import { API_BASE_URL } from '@infrastructure/constants/api/api-hosts';

/** Host-app callbacks and providers injected into the infrastructure wiring. */
interface InfrastructureOptions {
  /**
   * Invoked on every backend 401. Wired into the HTTP client so the app can
   * clear the session and route to login; the auth store gates the actual
   * logout (a 401 outside an authenticated session is a no-op).
   */
  onUnauthorized?: () => void;
}

export const registerInfrastructure = (container: Container, opts?: InfrastructureOptions): void => {
  const storage = new SecureTokenStorage();
  container.register(TOKENS.KeyValueStore, () => kvStore);
  const deviceIdentity = new StoredDeviceIdentity(
    kvStore,
    randomUUID,
    currentDevicePlatform(),
    Constants.expoConfig?.version ?? null,
  );
  container.register(TOKENS.DeviceIdentity, () => deviceIdentity);
  container.register(TOKENS.NotificationService, () => new NotificationService());
  container.register(TOKENS.AlarmAudioService, () => new AlarmAudioService());
  container.register(TOKENS.AdsService, () => new AdsService());
  container.register(TOKENS.AssistantSession, () => new GeminiLiveSession());
  container.register(TOKENS.AssistantMicrophone, () => new Microphone());
  container.register(TOKENS.AssistantPlayer, () => new PcmPlayer());
  container.register(
    TOKENS.AssistantTokenRepository,
    () => new AssistantTokenRepository(container.resolve(TOKENS.HttpClient)),
  );
  container.register(
    TOKENS.AssistantMessenger,
    () => new AssistantMessenger(container.resolve(TOKENS.HttpClient)),
  );
  // OS assistant integrations behind a port; the web half reports unavailable.
  container.register(TOKENS.OsAssistant, () => new OsAssistantBridge());
  // Fold and hinge posture; the web half reads the Viewport Segments API.
  container.register(TOKENS.WindowPosture, () => new WindowPostureBridge());
  container.register(TOKENS.DeviceLocaleProvider, () => new ExpoDeviceLocaleProvider());

  // The single source of the active language.
  container.register(
    TOKENS.LocaleService,
    () =>
      new LocaleService(
        container.resolve<KeyValueStoreInterface>(TOKENS.KeyValueStore),
        container.resolve<DeviceLocaleProviderInterface>(TOKENS.DeviceLocaleProvider),
      ),
  );

  const httpClientOptions: HttpClientOptions = {
    baseUrl: API_BASE_URL,
    tokenProvider: async () => {
      const result = await storage.loadSession();
      if (!result.ok || result.value === null) {
        return null;
      }
      return result.value.accessToken;
    },
    // Resolved per request; awaiting hydrate() stops startup requests racing the saved language.
    localeProvider: async () => {
      const localeService = container.resolve<LocaleService>(TOKENS.LocaleService);
      await localeService.hydrate();
      return localeService.getLocale();
    },
    enableLogging: __DEV__,
  };
  if (opts?.onUnauthorized) {
    httpClientOptions.onUnauthorized = opts.onUnauthorized;
  }
  container.register(TOKENS.HttpClient, () => new HttpClient(httpClientOptions));

  container.register(TOKENS.AuthRepository, () => {
    const http = container.resolve<HttpClient>(TOKENS.HttpClient);
    return new AuthRepository(
      http,
      storage,
      container.resolve<DeviceIdentityInterface>(TOKENS.DeviceIdentity),
    );
  });

  container.register(
    TOKENS.DeviceRepository,
    () => new DeviceRepository(container.resolve<HttpClient>(TOKENS.HttpClient)),
  );

  container.register(TOKENS.RecipeRepository, () => {
    const http = container.resolve<HttpClient>(TOKENS.HttpClient);
    return new RecipeRepository(http);
  });

  container.register(TOKENS.TaxonomyRepository, () => {
    const http = container.resolve<HttpClient>(TOKENS.HttpClient);
    return new TaxonomyRepository(http);
  });

  container.register(TOKENS.LoadTaxonomyUseCase, () => {
    const repo = container.resolve<TaxonomyRepository>(TOKENS.TaxonomyRepository);
    return new LoadTaxonomyUseCase(repo);
  });

  container.register(TOKENS.RecipeDraftRepository, () => {
    const http = container.resolve<HttpClient>(TOKENS.HttpClient);
    return new RecipeDraftRepository(http);
  });

  container.register(TOKENS.FavoritesRepository, () => {
    const http = container.resolve<HttpClient>(TOKENS.HttpClient);
    return new FavoritesRepository(http);
  });

  container.register(TOKENS.FoodDiaryRepository, () => {
    const http = container.resolve<HttpClient>(TOKENS.HttpClient);
    return new FoodDiaryRepository(http);
  });

  container.register(TOKENS.FoodCatalogRepository, () => {
    const http = container.resolve<HttpClient>(TOKENS.HttpClient);
    return new FoodCatalogRepository(http);
  });

  container.register(TOKENS.InstagramRepository, () => {
    const http = container.resolve<HttpClient>(TOKENS.HttpClient);
    return new InstagramRepository(http);
  });

  container.register(TOKENS.AddFavoriteUseCase, () => {
    const repo = container.resolve<FavoritesRepository>(TOKENS.FavoritesRepository);
    return new AddFavoriteUseCase(repo);
  });

  container.register(TOKENS.RemoveFavoriteUseCase, () => {
    const repo = container.resolve<FavoritesRepository>(TOKENS.FavoritesRepository);
    return new RemoveFavoriteUseCase(repo);
  });

  container.register(TOKENS.LoadFavoritesUseCase, () => {
    const repo = container.resolve<FavoritesRepository>(TOKENS.FavoritesRepository);
    return new LoadFavoritesUseCase(repo);
  });

  container.register(TOKENS.CommentRepository, () => {
    const http = container.resolve<HttpClient>(TOKENS.HttpClient);
    return new CommentRepository(http);
  });

  container.register(TOKENS.LikeRepository, () => {
    const http = container.resolve<HttpClient>(TOKENS.HttpClient);
    return new LikeRepository(http);
  });

  container.register(TOKENS.LikeRecipeUseCase, () => {
    const repo = container.resolve<LikeRepository>(TOKENS.LikeRepository);
    return new LikeRecipeUseCase(repo);
  });

  container.register(TOKENS.UnlikeRecipeUseCase, () => {
    const repo = container.resolve<LikeRepository>(TOKENS.LikeRepository);
    return new UnlikeRecipeUseCase(repo);
  });

  container.register(TOKENS.LoadLikedRecipesUseCase, () => {
    const repo = container.resolve<LikeRepository>(TOKENS.LikeRepository);
    return new LoadLikedRecipesUseCase(repo);
  });

  container.register(TOKENS.NotificationRepository, () => {
    const http = container.resolve<HttpClient>(TOKENS.HttpClient);
    return new NotificationRepository(http);
  });

  container.register(TOKENS.UserProfileRepository, () => {
    const http = container.resolve<HttpClient>(TOKENS.HttpClient);
    return new UserProfileRepository(http);
  });

  container.register(TOKENS.ListNotificationsUseCase, () => {
    const repo = container.resolve<NotificationRepository>(TOKENS.NotificationRepository);
    return new ListNotificationsUseCase(repo);
  });

  container.register(TOKENS.MarkAllReadUseCase, () => {
    const repo = container.resolve<NotificationRepository>(TOKENS.NotificationRepository);
    return new MarkAllReadUseCase(repo);
  });

  container.register(TOKENS.MarkOneReadUseCase, () => {
    const repo = container.resolve<NotificationRepository>(TOKENS.NotificationRepository);
    return new MarkOneReadUseCase(repo);
  });

  container.register(TOKENS.RegisterDeviceTokenUseCase, () => {
    const repo = container.resolve<NotificationRepository>(TOKENS.NotificationRepository);
    return new RegisterDeviceTokenUseCase(repo);
  });

  container.register(TOKENS.GetUserProfileUseCase, () => {
    const repo = container.resolve<UserProfileRepository>(TOKENS.UserProfileRepository);
    return new GetUserProfileUseCase(repo);
  });

  container.register(TOKENS.FeedbackRepository, () => {
    const http = container.resolve<HttpClient>(TOKENS.HttpClient);
    return new FeedbackRepository(http);
  });

  container.register(TOKENS.FeatureFlagRepository, () => {
    const http = container.resolve<HttpClient>(TOKENS.HttpClient);
    return new FeatureFlagRepository(http);
  });

  container.register(TOKENS.FeatureFlagResolver, () => new FeatureFlagResolver(
    container.resolve<FeatureFlagRepositoryInterface>(TOKENS.FeatureFlagRepository),
    IS_DEV_BUILD,
  ));

  container.register(TOKENS.SubmitFeedbackUseCase, () => {
    const repo = container.resolve<FeedbackRepository>(TOKENS.FeedbackRepository);
    return new SubmitFeedbackUseCase(repo);
  });
};
