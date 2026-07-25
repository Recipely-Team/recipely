import { useEffect, useRef, useState } from 'react';
import { Image, Linking, Pressable, Share, StyleSheet, View } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Ionicons } from '@expo/vector-icons';
import { BottomSheet } from '@presentation/base/widgets/sheets/bottom-sheet';
import { ChannelTile } from '@presentation/app/recipes/[recipeId]/sheets/channel-tile';
import { ThemedText } from '@presentation/base/widgets/text/themed-text';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { spacing, radii, fontSizes, fontWeights, iconSizes, mediaSizes, borderWidths } from '@presentation/base/theme';
import { t } from '@presentation/i18n';
import { ValueConstants } from '@core/constants';

export interface RecipeShareSheetProps {
  visible: boolean;
  onClose: () => void;
  recipeName: string;
  cuisine?: string;
  imageUrl?: string;
  url: string;
}

const COPIED_RESET_MS = 1800;
const THUMBNAIL_SIZE = mediaSizes.shareThumb;

/** Bottom-sheet share dialog for a recipe — channels, link display, and copy. */
export const RecipeShareSheet = ({
  visible,
  onClose,
  recipeName,
  cuisine,
  imageUrl,
  url,
}: RecipeShareSheetProps): React.JSX.Element => {
  const colors = useTheme().colors;
  const [copied, setCopied] = useState(false);
  const resetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (resetTimerRef.current !== null) {
        clearTimeout(resetTimerRef.current);
      }
    };
  }, []);

  const shareText = t().recipes.shareText.replace('{name}', recipeName);

  const handleCopy = async (): Promise<void> => {
    try {
      await Clipboard.setStringAsync(url);
    } catch {
      return;
    }
    setCopied(true);
    if (resetTimerRef.current !== null) {
      clearTimeout(resetTimerRef.current);
    }
    resetTimerRef.current = setTimeout(() => {
      setCopied(false);
      resetTimerRef.current = null;
    }, COPIED_RESET_MS);
  };

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

  return (
    <BottomSheet
      visible={visible}
      title={t().recipes.shareTitle}
      onClose={onClose}
    >
      {/* Recipe preview card */}
      <View
        style={[
          styles.previewCard,
          { backgroundColor: colors.surface, borderColor: colors.cardBorder },
        ]}
      >
        {imageUrl !== undefined ? (
          <Image
            source={{ uri: imageUrl }}
            style={styles.thumbnail}
            accessibilityRole="image"
            accessibilityLabel={recipeName}
          />
        ) : (
          <View
            style={[styles.thumbnail, styles.thumbnailPlaceholder, { backgroundColor: colors.chipBackground }]}
          />
        )}
        <View style={styles.previewText}>
          <ThemedText
            variant="body"
            numberOfLines={1}
            style={styles.previewName}
          >
            {recipeName}
          </ThemedText>
          {cuisine !== undefined ? (
            <ThemedText variant="caption" muted numberOfLines={1}>
              {cuisine}
            </ThemedText>
          ) : null}
        </View>
      </View>

      {/* Channel grid */}
      <View style={styles.channelRow}>
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

      {/* Link section */}
      <ThemedText variant="label" muted style={styles.linkSectionLabel}>
        {t().recipes.shareLink}
      </ThemedText>
      <View style={styles.linkRow}>
        <View
          style={[
            styles.linkPill,
            { backgroundColor: colors.surface, borderColor: colors.cardBorder },
          ]}
        >
          <Ionicons name="link-outline" size={iconSizes.md} color={colors.textMuted} />
          <ThemedText variant="caption" muted numberOfLines={1} style={styles.linkText}>
            {url}
          </ThemedText>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={copied ? t().recipes.shareCopied : t().recipes.shareCopy}
          onPress={() => void handleCopy()}
          style={[
            styles.copyBtn,
            {
              backgroundColor: copied ? colors.success : colors.primary,
              borderRadius: radii.lg,
            },
          ]}
        >
          <Ionicons
            name={copied ? 'checkmark' : 'copy-outline'}
            size={iconSizes.md}
            color={copied ? colors.onSuccess : colors.primaryText}
          />
          <ThemedText
            variant="caption"
            style={[
              styles.copyLabel,
              { color: copied ? colors.onSuccess : colors.primaryText },
            ]}
          >
            {copied ? t().recipes.shareCopied : t().recipes.shareCopy}
          </ThemedText>
        </Pressable>
      </View>
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  previewCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderWidth: borderWidths.hairline,
    borderRadius: radii.lg,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  thumbnail: {
    width: THUMBNAIL_SIZE,
    height: THUMBNAIL_SIZE,
    borderRadius: radii.md,
  },
  thumbnailPlaceholder: {
    width: THUMBNAIL_SIZE,
    height: THUMBNAIL_SIZE,
    borderRadius: radii.md,
  },
  previewText: {
    flex: ValueConstants.one,
    gap: spacing.xs,
  },
  previewName: {
    fontWeight: fontWeights.bold,
  },
  channelRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  linkSectionLabel: {
    marginBottom: spacing.sm,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  linkPill: {
    flex: ValueConstants.one,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    borderWidth: borderWidths.hairline,
    borderRadius: radii.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  linkText: {
    flex: ValueConstants.one,
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  copyLabel: {
    fontSize: fontSizes.small,
    fontWeight: fontWeights.semibold,
  },
});
