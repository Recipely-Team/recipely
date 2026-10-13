import { useState } from 'react';
import { Linking, Platform, Share, StyleSheet, View } from 'react-native';
import { PrimaryButton } from '@presentation/base/widgets/buttons/primary-button';
import { ChannelTile } from '@presentation/app/recipes/[recipeId]/sheets/channel-tile';
import { RecipeShareCard } from '@presentation/app/recipes/[recipeId]/sheets/recipe-share-card';
import { useShareCard } from '@presentation/app/recipes/[recipeId]/hooks/share/use-share-card';
import { ShareCardLayout } from '@presentation/app/recipes/[recipeId]/model/share/share-card-layout';
import { spacing } from '@presentation/base/theme';
import { t } from '@presentation/i18n';
import { ValueConstants } from '@core/constants';

export interface ShareChannelsProps {
  /** The card is drawn only while the sheet is open, so its photo loads then. */
  visible: boolean;
  recipeName: string;
  cuisine?: string;
  imageUrl?: string;
  url: string;
  totalMinutes: number;
  ingredients: readonly string[];
}

/** Opens WhatsApp's own chat picker on phones, WhatsApp Web elsewhere. */
const WHATSAPP_SHARE_URL = 'https://wa.me/?text=';
/** The image card needs the native capture and file-share modules; the web shares the link. */
const CAN_SHARE_CARD = Platform.OS !== 'web';

/**
 * The share sheet's channels: a Story / Reel button above WhatsApp, Message, Email and More.
 *
 * @remarks
 * - **Story / Reel** shares a 9:16 image of the recipe (`RecipeShareCard`) through
 *   the system sheet; if the device cannot, it shares the link instead.
 * - **WhatsApp** sends the link; WhatsApp previews it with the recipe photo.
 */
export const ShareChannels = ({
  visible,
  recipeName,
  cuisine,
  imageUrl,
  url,
  totalMinutes,
  ingredients,
}: ShareChannelsProps): React.JSX.Element => {
  const shareText = t().recipes.shareText.replace('{name}', recipeName);

  const handleMessage = (): void => {
    void Linking.openURL(
      'sms:?body=' + encodeURIComponent(shareText + ' ' + url),
    ).catch(() => undefined);
  };

  const handleEmail = (): void => {
    void Linking.openURL(
      'mailto:?subject=' +
        encodeURIComponent(recipeName) +
        '&body=' +
        encodeURIComponent(shareText + '\n\n' + url),
    ).catch(() => undefined);
  };

  const handleMore = (): void => {
    void Share.share({ message: shareText + ' ' + url, url, title: recipeName }).catch(
      () => undefined,
    );
  };

  const handleWhatsApp = (): void => {
    void Linking.openURL(WHATSAPP_SHARE_URL + encodeURIComponent(shareText + ' ' + url)).catch(() => undefined);
  };

  const { cardRef, onCardReady, shareCard } = useShareCard();
  const [cardBusy, setCardBusy] = useState(false);
  const handleStory = (): void => {
    setCardBusy(true);
    void shareCard(t().recipes.shareTitle).then((shared) => {
      setCardBusy(false);
      if (!shared) handleMore();
    });
  };

  return (
    <>
        {CAN_SHARE_CARD && visible ? (
          <View style={styles.offscreen} pointerEvents="none">
            <RecipeShareCard
              ref={cardRef}
              recipeName={recipeName}
              cuisine={cuisine}
              totalMinutes={totalMinutes}
              ingredients={ingredients}
              imageUrl={imageUrl}
              onReady={onCardReady}
            />
          </View>
        ) : null}

        {CAN_SHARE_CARD ? (
          <View style={styles.storyButton}>
            <PrimaryButton label={t().recipes.shareChannelStory} onPress={handleStory} loading={cardBusy} />
          </View>
        ) : null}

        {/* Channel grid */}
        <View style={styles.channelRow}>
          <ChannelTile
            icon="logo-whatsapp"
            label={t().recipes.shareChannelWhatsApp}
            onPress={handleWhatsApp}
          />
          <ChannelTile
            icon="chatbubble-outline"
            label={t().recipes.shareChannelMessage}
            onPress={handleMessage}
          />
          <ChannelTile
            icon="mail-outline"
            label={t().recipes.shareChannelEmail}
            onPress={handleEmail}
          />
          <ChannelTile
            icon="share-social-outline"
            label={t().recipes.shareChannelMore}
            onPress={handleMore}
          />
        </View>
    </>
  );
};

const styles = StyleSheet.create({
  storyButton: {
    marginBottom: spacing.md,
  },
  offscreen: {
    position: 'absolute',
    top: ValueConstants.zero,
    left: -ShareCardLayout.width * ValueConstants.two,
  },
  channelRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
});
