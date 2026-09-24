import { ActionSheetIOS, Alert } from 'react-native';
import { isIos, isWeb } from '@infrastructure/constants/platform';
import { PickSource } from '@presentation/base/utils/pick-source';
import { t } from '@presentation/i18n';

const CAMERA_INDEX = 0;
const LIBRARY_INDEX = 1;
const CANCEL_INDEX = 2;

/**
 * Asks where a photo should come from — the camera or the library — and
 * resolves with the answer, or `null` when the user backs out.
 *
 * @remarks
 * - **One chooser, three callers.** The avatar, a published recipe's photos and
 *   the recipe editor all offer the same two sources; the sheet used to be
 *   copied into each of them, and the editor was the one that never got it —
 *   it opened the library and nothing else.
 * - **Web skips the question.** The picker has no reliable camera in a
 *   browser, so the library is the answer without asking.
 * - **Android's dialog is cancelable.** Tapping outside it dismisses without a
 *   button press, which has to resolve too — a promise left pending there
 *   would hold the caller's busy flag forever.
 */
export const askPickSource = (title: string): Promise<PickSource | null> => {
  if (isWeb()) return Promise.resolve(PickSource.Library);

  return new Promise((resolve) => {
    if (isIos()) {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          title,
          options: [t().profile.takePhoto, t().profile.chooseFromLibrary, t().common.cancel],
          cancelButtonIndex: CANCEL_INDEX,
        },
        (index) => {
          if (index === CAMERA_INDEX) resolve(PickSource.Camera);
          else if (index === LIBRARY_INDEX) resolve(PickSource.Library);
          else resolve(null);
        },
      );
      return;
    }

    Alert.alert(
      title,
      undefined,
      [
        { text: t().profile.takePhoto, onPress: () => resolve(PickSource.Camera) },
        { text: t().profile.chooseFromLibrary, onPress: () => resolve(PickSource.Library) },
        { text: t().common.cancel, style: 'cancel', onPress: () => resolve(null) },
      ],
      { cancelable: true, onDismiss: () => resolve(null) },
    );
  });
};
