import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { SizedText } from '@presentation/base/widgets/text/sized-text';
import { controlSizes, fontSizes, fontWeights, spacing } from '@presentation/base/theme';
import { t } from '@presentation/i18n';

export interface LoadMoreRowProps {
  failed: boolean;
  onRetry: () => void;
}

/** Under a list whose next page is loading ("Loading more…"), or failed ("Try again", inline). */
export const LoadMoreRow = ({ failed, onRetry }: LoadMoreRowProps): React.JSX.Element => {
  const colors = useTheme().colors;
  const strings = t().diary;
  if (failed) {
    return (
      <Pressable onPress={onRetry} accessibilityRole="button" style={styles.row}>
        <SizedText size={fontSizes.caption} weight={fontWeights.bold} color={colors.primary}>
          {strings.tryAgain}
        </SizedText>
      </Pressable>
    );
  }
  return (
    <View style={styles.row} accessibilityRole="progressbar" accessibilityLiveRegion="polite">
      <ActivityIndicator size="small" color={colors.primary} />
      <SizedText size={fontSizes.caption} muted>
        {strings.loadingMore}
      </SizedText>
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    minHeight: controlSizes.touchTarget,
  },
});
