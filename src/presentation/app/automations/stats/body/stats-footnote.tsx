import { StyleSheet, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { ValueConstants } from '@core/constants';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { SizedText } from '@presentation/base/widgets/text/sized-text';
import { fontSizes, iconSizes, lineHeights, spacing } from '@presentation/base/theme';
import { t } from '@presentation/i18n';

/** How Recipely counts opens and saves (spec "Footnote"). */
export const StatsFootnote = (): React.JSX.Element => {
  const colors = useTheme().colors;
  return (
    <View style={styles.row}>
      <Ionicons name="information-circle-outline" size={iconSizes.sm} color={colors.textSubtle} />
      <SizedText size={fontSizes.small} ratio={lineHeights.normal} color={colors.textSubtle} style={styles.text}>
        {t().creatorStats.footnote}
      </SizedText>
    </View>
  );
};

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xl },
  text: { flex: ValueConstants.one },
});
