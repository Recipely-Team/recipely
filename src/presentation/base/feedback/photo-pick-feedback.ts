import { Linking } from 'react-native';
import { showDangerToast } from '@presentation/base/feedback/show-toast';
import { toastStore } from '@presentation/base/feedback/toast-store';
import { SeverityType } from '@presentation/base/theme/colors/surfaces/severity-type';
import { t } from '@presentation/i18n';

/**
 * What a photo picker tells the user when it cannot do its job — through the
 * app's toast, which shows on every platform (`Alert.alert` is a no-op on the
 * web). Shared by the create-recipe media picker and the import page picker.
 */
export const PhotoPickFeedback = {
  /** Camera or library access was refused; the toast's action opens Settings. */
  permissionDenied: (): void => {
    toastStore.getState().show({
      severity: SeverityType.Warning,
      message: t().recipes.photoPermissionDenied,
      actionLabel: t().common.openSettings,
      onAction: () => void Linking.openSettings().catch(() => undefined),
    });
  },
  /** The pick or its shrink failed for any other reason. */
  failed: (): void => {
    showDangerToast(t().recipes.photoAddFailed);
  },
};
