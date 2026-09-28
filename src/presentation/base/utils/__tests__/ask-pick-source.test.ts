/**
 * The source chooser resolves on every way out. Android's dialog is dismissed
 * by a tap outside it, which presses no button — a promise left pending there
 * would hold the caller's one-flight guard shut, and the photo button would
 * never answer again.
 */
/* eslint-disable import/first -- jest.mock() must be hoisted above imports */

const mockIsWeb = jest.fn();

jest.mock('@infrastructure/constants/platform', () => ({
  isWeb: () => mockIsWeb(),
  isIos: () => false,
}));

import { Alert } from 'react-native';
import { askPickSource } from '@presentation/base/utils/ask-pick-source';
import { PickSource } from '@presentation/base/utils/pick-source';
import { t } from '@presentation/i18n';

describe('askPickSource', () => {
  beforeEach(() => mockIsWeb.mockReturnValue(false));

  it('goes straight to the library on web, without asking', async () => {
    mockIsWeb.mockReturnValue(true);
    const alert = jest.spyOn(Alert, 'alert');

    await expect(askPickSource('title')).resolves.toBe(PickSource.Library);
    expect(alert).not.toHaveBeenCalled();
    alert.mockRestore();
  });

  it('resolves with the camera when it is chosen', async () => {
    const alert = jest.spyOn(Alert, 'alert').mockImplementation((_t, _m, buttons) => {
      buttons?.find((b) => b.text === t().profile.takePhoto)?.onPress?.();
    });

    await expect(askPickSource('title')).resolves.toBe(PickSource.Camera);
    alert.mockRestore();
  });

  it('resolves null when the dialog is dismissed by a tap outside it', async () => {
    const alert = jest.spyOn(Alert, 'alert').mockImplementation((_t, _m, _b, options) => {
      options?.onDismiss?.();
    });

    await expect(askPickSource('title')).resolves.toBeNull();
    alert.mockRestore();
  });
});
