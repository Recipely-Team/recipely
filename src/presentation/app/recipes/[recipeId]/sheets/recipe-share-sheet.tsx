import { useEffect, useRef, useState } from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import Ionicons from '@expo/vector-icons/Ionicons';
import { BottomSheet } from '@presentation/base/widgets/sheets/bottom-sheet';
import { ShareChannels } from '@presentation/app/recipes/[recipeId]/sheets/share-channels';
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
  totalMinutes: number;
  ingredients: readonly string[];
}

const COPIED_RESET_MS = 1800;
const THUMBNAIL_SIZE = mediaSizes.shareThumb;

/** Bottom-sheet share dialog for a recipe — channels (`ShareChannels`), link display, and copy. */
export const RecipeShareSheet = ({
  visible,
  onClose,
  recipeName,
  cuisine,
  imageUrl,
  url,
  totalMinutes,
  ingredients,
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
            numberOfLines={ValueConstants.one}
            style={styles.previewName}
          >
            {recipeName}
          </ThemedText>
          {cuisine !== undefined ? (
            <ThemedText variant="caption" muted numberOfLines={ValueConstants.one}>
              {cuisine}
            </ThemedText>
          ) : null}
        </View>
      </View>

      <ShareChannels
        visible={visible}
        recipeName={recipeName}
        cuisine={cuisine}
        imageUrl={imageUrl}
        url={url}
        totalMinutes={totalMinutes}
        ingredients={ingredients}
      />

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
          <ThemedText variant="caption" muted numberOfLines={ValueConstants.one} style={styles.linkText}>
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
