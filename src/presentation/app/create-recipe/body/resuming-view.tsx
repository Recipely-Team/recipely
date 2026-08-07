import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SkeletonLoader } from '@presentation/base/widgets/loading/skeleton-loader';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import {
  spacing,
  radii,
  fontSizes,
  iconSizes,
  controlSizes,
  mediaSizes,
  borderWidths,
} from '@presentation/base/theme';
import { t } from '@presentation/i18n';
import { ValueConstants } from '@core/constants';

export interface ResumingViewProps {
  isWebShell: boolean;
  topInset: number;
  onClose: () => void;
}

/** Ingredient/step placeholder rows under the spec card. */
const ROW_COUNT = 4;
const ROW_HEIGHT = fontSizes.body;
/** Widths that keep the placeholder rows from reading as a solid block. */
const ROW_WIDTHS = ['92%', '78%', '86%', '64%'] as const;

/**
 * What the screen shows while a draft opened via `?draftId=` is being fetched.
 *
 * @remarks
 * - **It mirrors the editor, not a spinner.** The next thing to appear is the
 *   preview editor, so the wait shows its shape — cover, title, spec card,
 *   rows — and the content lands in place instead of replacing something else.
 * - **The close button is live from the first frame.** The fetch can be slow or
 *   fail; a wait with no way out is the thing that made this feel stuck.
 */
export const ResumingView = ({ isWebShell, topInset, onClose }: ResumingViewProps): React.JSX.Element => {
  const colors = useTheme().colors;

  return (
    <View style={styles.root}>
      <View
        style={[
          styles.header,
          {
            backgroundColor: colors.background,
            borderBottomColor: colors.border,
            paddingTop: isWebShell ? spacing.md : topInset + spacing.sm,
          },
        ]}
      >
        <Pressable
          onPress={onClose}
          hitSlop={spacing.sm}
          style={styles.iconBtn}
          accessibilityRole="button"
          accessibilityLabel={t().createRecipe.cancel}
        >
          <Ionicons name="close" size={iconSizes.lg} color={colors.text} />
        </Pressable>
        <SkeletonLoader width="40%" height={fontSizes.subtitle} borderRadius={radii.sm} />
        <View style={styles.iconBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.content} accessibilityLabel={t().drafts.continue}>
        <SkeletonLoader width="100%" height={mediaSizes.coverMaxHeight} borderRadius={radii.xl} />
        <SkeletonLoader width="70%" height={fontSizes.title} borderRadius={radii.sm} />

        <View
          style={[
            styles.specCard,
            { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder },
          ]}
        >
          <SkeletonLoader width="45%" height={ROW_HEIGHT} borderRadius={radii.sm} />
          <SkeletonLoader width="60%" height={ROW_HEIGHT} borderRadius={radii.sm} />
          <SkeletonLoader width="35%" height={ROW_HEIGHT} borderRadius={radii.sm} />
        </View>

        <View style={styles.rows}>
          {ROW_WIDTHS.slice(ValueConstants.zero, ROW_COUNT).map((width) => (
            <SkeletonLoader key={width} width={width} height={ROW_HEIGHT} borderRadius={radii.sm} />
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: ValueConstants.one,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: borderWidths.hairline,
  },
  iconBtn: {
    width: controlSizes.iconBtn,
    height: controlSizes.iconBtn,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  specCard: {
    borderRadius: radii.xl,
    borderWidth: borderWidths.hairline,
    padding: spacing.md,
    gap: spacing.sm,
  },
  rows: {
    gap: spacing.sm,
  },
});
