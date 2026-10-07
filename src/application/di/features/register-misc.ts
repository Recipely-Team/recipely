import type { Container } from '@core/di/container';
import { TOKENS } from '@application/di/tokens';
import type { ApplicationStores } from '@application/di/application-stores';
import type { NotificationRepositoryInterface } from '@domain/notifications/notification-repository-interface';
import type { UserProfileRepositoryInterface } from '@domain/user-profile/user-profile-repository-interface';
import type { TaxonomyRepositoryInterface } from '@domain/recipes/taxonomy/taxonomy-repository-interface';
import type { FeedbackRepositoryInterface } from '@domain/feedback/feedback-repository-interface';
import { ListNotificationsUseCase } from '@application/notifications/list/list-notifications-use-case';
import { CountUnreadNotificationsUseCase } from '@application/notifications/list/count-unread-notifications-use-case';
import { MarkAllReadUseCase } from '@application/notifications/read/mark-all-read-use-case';
import { MarkOneReadUseCase } from '@application/notifications/read/mark-one-read-use-case';
import { configureNotificationsStore } from '@application/notifications/notifications-store';
import { RegisterDeviceTokenUseCase } from '@application/notifications/register-device-token-use-case';
import { getNotificationService } from '@application/notifications/get-notification-service';
import { getPreferenceStore } from '@application/storage/get-preference-store';
import { RefreshRemindersUseCase } from '@application/notifications/reminders/refresh-reminders-use-case';
import { SetRemindersChoiceUseCase } from '@application/notifications/reminders/set-reminders-choice-use-case';
import { GetRemindersEnabledUseCase } from '@application/notifications/reminders/get-reminders-enabled-use-case';
import { ShouldOfferRemindersUseCase } from '@application/notifications/reminders/should-offer-reminders-use-case';
import { GetUserProfileUseCase } from '@application/user-profile/get-user-profile-use-case';
import { configureUserProfileStore } from '@application/user-profile/user-profile-store';
import { LoadTaxonomyUseCase } from '@application/recipes/taxonomy/load-taxonomy-use-case';
import { configureTaxonomyStore } from '@application/recipes/taxonomy/taxonomy-store';
import { SubmitFeedbackUseCase } from '@application/feedback/submit-feedback-use-case';
import { configureFeedbackStore } from '@application/feedback/feedback-store';

/**
 * **Small-feature composition** — notifications, the signed-in user's profile, the recipe
 * taxonomy and feedback: each one store over use cases built on its repository port; plus the
 * come-back reminders, use cases over the notification and preference ports.
 */
export const registerMisc = (
  container: Container,
): Pick<
  ApplicationStores,
  | 'notificationsStore'
  | 'registerDeviceToken'
  | 'refreshReminders'
  | 'setRemindersChoice'
  | 'getRemindersEnabled'
  | 'shouldOfferReminders'
  | 'userProfileStore'
  | 'getUserProfile'
  | 'taxonomyStore'
  | 'feedbackStore'
> => {
  const notificationRepo = container.resolve<NotificationRepositoryInterface>(TOKENS.NotificationRepository);
  const userProfileRepo = container.resolve<UserProfileRepositoryInterface>(TOKENS.UserProfileRepository);
  const taxonomyRepo = container.resolve<TaxonomyRepositoryInterface>(TOKENS.TaxonomyRepository);
  const feedbackRepo = container.resolve<FeedbackRepositoryInterface>(TOKENS.FeedbackRepository);

  const notificationsStore = configureNotificationsStore({
    listNotifications: new ListNotificationsUseCase(notificationRepo),
    countUnread: new CountUnreadNotificationsUseCase(notificationRepo),
    markAllRead: new MarkAllReadUseCase(notificationRepo),
    markOneRead: new MarkOneReadUseCase(notificationRepo),
  });
  const getUserProfile = new GetUserProfileUseCase(userProfileRepo);
  const userProfileStore = configureUserProfileStore({ getUserProfile });
  const taxonomyStore = configureTaxonomyStore({ loadTaxonomyUseCase: new LoadTaxonomyUseCase(taxonomyRepo) });
  const feedbackStore = configureFeedbackStore({ submitFeedbackUseCase: new SubmitFeedbackUseCase(feedbackRepo) });
  const notificationService = getNotificationService();
  const preferences = getPreferenceStore();
  const refreshReminders = new RefreshRemindersUseCase(notificationService, preferences);
  return {
    notificationsStore,
    refreshReminders,
    setRemindersChoice: new SetRemindersChoiceUseCase(notificationService, preferences, refreshReminders),
    getRemindersEnabled: new GetRemindersEnabledUseCase(notificationService, preferences),
    shouldOfferReminders: new ShouldOfferRemindersUseCase(preferences),
    registerDeviceToken: new RegisterDeviceTokenUseCase(notificationRepo),
    userProfileStore,
    getUserProfile,
    taxonomyStore,
    feedbackStore,
  };
};
