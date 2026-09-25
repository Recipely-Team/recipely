import { useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ImportFileMimeType } from '@domain/recipes/import-file/import-file-mime-type';
import type { ImportFile } from '@domain/recipes/import-file/import-file';
import { ThemedText } from '@presentation/base/widgets/text/themed-text';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { spacing, radii, fontSizes, fontWeights, letterSpacings, iconSizes } from '@presentation/base/theme';
import { t } from '@presentation/i18n';
import { ValueConstants } from '@core/constants';

export interface FilePageThumbProps {
  file: ImportFile;
  /** The page sheet's large preview, with larger type. */
  large?: boolean;
}

const NAME_LINES = 2;

/**
 * What a picked page looks like: the photo itself, or a PDF card with its name.
 *
 * A photo that fails to load falls back to a named placeholder rather than an
 * empty box, so the user can still tell which page it was.
 */
export const FilePageThumb = ({ file, large = false }: FilePageThumbProps): React.JSX.Element => {
  const colors = useTheme().colors;
  const [broken, setBroken] = useState(false);
  const isPdf = file.mimeType === ImportFileMimeType.Pdf;

  if (!isPdf && !broken) {
    return <Image source={{ uri: file.uri }} style={styles.fill} resizeMode="cover" onError={() => setBroken(true)} />;
  }

  return (
    <View style={[styles.fill, styles.card, { backgroundColor: colors.surface }]}>
      {isPdf ? (
        <View style={[styles.badge, { backgroundColor: colors.primary }]}>
          <ThemedText style={[styles.badgeText, large ? styles.badgeTextLarge : null, { color: colors.primaryText }]}>
            {t().fileImport.pdfLabel}
          </ThemedText>
        </View>
      ) : (
        <Ionicons name="image-outline" size={large ? iconSizes.xxxl : iconSizes.xl} color={colors.textMuted} />
      )}
      <ThemedText
        variant="caption"
        numberOfLines={NAME_LINES}
        style={[styles.name, large ? null : styles.nameSmall, { color: colors.text }]}
      >
        {file.fileName}
      </ThemedText>
    </View>
  );
};

const styles = StyleSheet.create({
  fill: {
    width: '100%',
    height: '100%',
  },
  card: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs2,
    padding: spacing.sm,
  },
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: radii.sm,
  },
  badgeText: {
    fontSize: fontSizes.micro,
    fontWeight: fontWeights.heavy,
    letterSpacing: letterSpacings.wider,
  },
  badgeTextLarge: {
    fontSize: fontSizes.medium,
  },
  name: {
    textAlign: 'center',
    fontWeight: fontWeights.semibold,
  },
  nameSmall: {
    fontSize: fontSizes.micro,
    flexShrink: ValueConstants.one,
  },
});
