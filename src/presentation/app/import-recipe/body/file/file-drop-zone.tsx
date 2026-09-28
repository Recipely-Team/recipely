import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@presentation/base/widgets/text/themed-text';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { spacing, radii, fontWeights, iconSizes, borderWidths } from '@presentation/base/theme';
import { t } from '@presentation/i18n';

export interface FileDropZoneProps {
  /** A file is being dragged over the window. */
  isDragging: boolean;
  onChoose: () => void;
}

/** The upload disc, as the design draws it. */
const DISC = 56;
/** The "Choose files" button's height in the design — a compact action, not the page's CTA. */
const CHOOSE_MIN_HEIGHT = 44;

/**
 * The web's empty state: drop photos or a PDF anywhere, or choose them.
 *
 * The whole window accepts the drop (`useFileDrop`); this box is where the
 * user is told so, and it lights up while a file is over the page.
 */
export const FileDropZone = ({ isDragging, onChoose }: FileDropZoneProps): React.JSX.Element => {
  const colors = useTheme().colors;
  const copy = t().fileImport;

  return (
    <View
      style={[
        styles.zone,
        {
          borderColor: isDragging ? colors.primary : colors.inputBorder,
          backgroundColor: isDragging ? colors.chipBackground : colors.surface,
        },
      ]}
    >
      <View style={[styles.disc, { backgroundColor: colors.chipBackground }]}>
        <Ionicons name="cloud-upload-outline" size={iconSizes.xxl} color={colors.chipText} />
      </View>
      <ThemedText variant="subtitle" style={styles.centered}>
        {isDragging ? copy.dropNow : copy.drop}
      </ThemedText>
      <ThemedText variant="caption" style={{ color: colors.textMuted }}>
        {copy.or}
      </ThemedText>
      <Pressable
        onPress={onChoose}
        accessibilityRole="button"
        accessibilityLabel={copy.choose}
        style={[styles.choose, { backgroundColor: colors.primary }]}
      >
        <ThemedText variant="body" style={[styles.chooseLabel, { color: colors.primaryText }]}>
          {copy.choose}
        </ThemedText>
      </Pressable>
      <ThemedText variant="caption" style={[styles.centered, styles.formats, { color: colors.textMuted }]}>
        {copy.formats}
      </ThemedText>
    </View>
  );
};

const styles = StyleSheet.create({
  zone: {
    alignItems: 'center',
    gap: spacing.sm2,
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.lg2,
    borderRadius: radii.xl,
    borderWidth: borderWidths.medium,
    borderStyle: 'dashed',
  },
  disc: {
    width: DISC,
    height: DISC,
    borderRadius: radii.round,
    alignItems: 'center',
    justifyContent: 'center',
  },
  choose: {
    minHeight: CHOOSE_MIN_HEIGHT,
    paddingHorizontal: spacing.lg2,
    borderRadius: radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chooseLabel: {
    fontWeight: fontWeights.bold,
  },
  formats: {
    marginTop: spacing.xs,
  },
  centered: {
    textAlign: 'center',
  },
});
