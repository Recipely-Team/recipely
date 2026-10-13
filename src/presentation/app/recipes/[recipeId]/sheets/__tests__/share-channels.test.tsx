/**
 * Sharing a recipe to Instagram Stories / Reels and WhatsApp.
 *
 * The share sheet offered Message, Email and More only: a recipe could reach
 * Instagram as a bare link, which a Story cannot show. "Story / Reel" now shares
 * a 9:16 image of the recipe, and WhatsApp has its own button.
 */

/* eslint-disable import/first -- jest.mock() must be hoisted above imports */

jest.mock('react-native-view-shot', () => ({ captureRef: jest.fn(async () => 'file:///card.png') }));
jest.mock('expo-sharing', () => ({
  isAvailableAsync: jest.fn(async () => true),
  shareAsync: jest.fn(async () => undefined),
}));

import { act } from 'react-test-renderer';
import { Linking, Share } from 'react-native';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import { ShareChannels } from '@presentation/app/recipes/[recipeId]/sheets/share-channels';
import { renderComponent } from '@presentation/base/test-support/render-component';
import { t } from '@presentation/i18n';

const URL = 'https://recipely.net/recipes/r1';

const renderChannels = () =>
  renderComponent(
    <ShareChannels
      visible
      recipeName="Menemen"
      cuisine="Turkish"
      url={URL}
      totalMinutes={20}
      servings={4}
      ingredients={['3 eggs', '# Sauce', '2 tomatoes']}
    />,
  );

const press = async (label: string, root: ReturnType<typeof renderChannels>['root']): Promise<void> => {
  const tile = root.find((node) => node.props.accessibilityLabel === label && typeof node.props.onPress === 'function');
  await act(async () => {
    (tile.props.onPress as () => void)();
    await Promise.resolve();
  });
};

describe('ShareChannels', () => {
  beforeEach(() => jest.clearAllMocks());

  it('shares the recipe card as a 1080×1920 PNG from "Story / Reel"', async () => {
    const { root } = renderChannels();

    await press(t().recipes.shareChannelStory, root);

    expect(captureRef).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ format: 'png', width: 1080, height: 1920 }));
    expect(Sharing.shareAsync).toHaveBeenCalledWith('file:///card.png', expect.objectContaining({ mimeType: 'image/png' }));
  });

  it('falls back to sharing the link when the device cannot share files', async () => {
    jest.mocked(Sharing.isAvailableAsync).mockResolvedValueOnce(false);
    const share = jest.spyOn(Share, 'share').mockResolvedValue({ action: 'sharedAction' });
    const { root } = renderChannels();

    await press(t().recipes.shareChannelStory, root);

    expect(captureRef).not.toHaveBeenCalled();
    expect(share).toHaveBeenCalledWith(expect.objectContaining({ url: URL }));
  });

  it('opens a WhatsApp chat carrying the recipe link', async () => {
    const open = jest.spyOn(Linking, 'openURL').mockResolvedValue(true);
    const { root } = renderChannels();

    await press(t().recipes.shareChannelWhatsApp, root);

    expect(open).toHaveBeenCalledWith(expect.stringMatching(/^https:\/\/wa\.me\/\?text=.*recipely\.net%2Frecipes%2Fr1/));
  });
});
