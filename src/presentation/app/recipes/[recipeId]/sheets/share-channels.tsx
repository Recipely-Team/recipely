import { mailtoShareUrl, smsShareUrl, whatsappShareUrl } from '@presentation/base/constants/external-links';
import { useState } from 'react';
import { Linking, Platform, Share, StyleSheet, View } from 'react-native';
import { PrimaryButton } from '@presentation/base/widgets/buttons/primary-button';
import { ChannelTile } from '@presentation/app/recipes/[recipeId]/sheets/channel-tile';
import { RecipeShareCard } from '@presentation/app/recipes/[recipeId]/sheets/recipe-share-card';
import { useShareCard } from '@presentation/app/recipes/[recipeId]/hooks/share/use-share-card';
import { ShareCardLayout } from '@presentation/app/recipes/[recipeId]/model/share/share-card-layout';
import { spacing } from '@presentation/base/theme';
import { useTranslations } from '@presentation/i18n';
import { CharConstants, ValueConstants } from '@core/constants';

export interface ShareChannelsProps {
  /** The card is drawn only while the sheet is open, so its photo loads then. */
  visible: boolean;
  recipeName: string;
  cuisine?: string | undefined;
  imageUrl?: string | undefined;
  url: string;
  totalMinutes: number;
  servings: number;
  ingredients: readonly string[];
}

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
  servings,
  ingredients,
}: ShareChannelsProps): React.JSX.Element => {
  const t = useTranslations();
  const shareText = t.recipes.shareText.replace('{name}', recipeName);

  const handleMessage = (): void => {
    void Linking.openURL(smsShareUrl(shareText + CharConstants.space + url)).catch(() => undefined);
  };

  const handleEmail = (): void => {
    void Linking.openURL(mailtoShareUrl(recipeName, shareText + CharConstants.paragraphBreak + url)).catch(() => undefined);
  };

  const handleMore = (): void => {
    void Share.share({ message: shareText + CharConstants.space + url, url, title: recipeName }).catch(
      () => undefined,
    );
  };

  const handleWhatsApp = (): void => {
    void Linking.openURL(whatsappShareUrl(shareText + CharConstants.space + url)).catch(() => undefined);
  };

  const { cardRef, onCardReady, shareCard } = useShareCard();
  const [isCardBusy, setCardBusy] = useState(false);
  const handleStory = (): void => {
    setCardBusy(true);
    void shareCard(t.recipes.shareTitle).then((wasShared) => {
      setCardBusy(false);
      if (!wasShared) handleMore();
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
              servings={servings}
              ingredients={ingredients}
              imageUrl={imageUrl}
              onReady={onCardReady}
            />
          </View>
        ) : null}

        {CAN_SHARE_CARD ? (
          <View style={styles.storyButton}>
            <PrimaryButton label={t.recipes.shareChannelStory} onPress={handleStory} loading={isCardBusy} />
          </View>
        ) : null}

        {/* Channel grid */}
        <View style={styles.channelRow}>
          <ChannelTile
            icon="logo-whatsapp"
            label={t.recipes.shareChannelWhatsApp}
            onPress={handleWhatsApp}
          />
          <ChannelTile
            icon="chatbubble-outline"
            label={t.recipes.shareChannelMessage}
            onPress={handleMessage}
          />
          <ChannelTile
            icon="mail-outline"
            label={t.recipes.shareChannelEmail}
            onPress={handleEmail}
          />
          <ChannelTile
            icon="share-social-outline"
            label={t.recipes.shareChannelMore}
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
