import { StyleSheet, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { ValueConstants } from '@core/constants';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { SizedText } from '@presentation/base/widgets/text/sized-text';
import { fontSizes, iconSizes, lineHeights, spacing } from '@presentation/base/theme';
import { t } from '@presentation/i18n';

/** The platform's rules in one line (spec → Rules note): one private reply per comment, within 7 days, never unasked. */
export const RulesNote = (): React.JSX.Element => {
  const colors = useTheme().colors;
  return (
    <View style={styles.note}>
      <Ionicons name="information-circle-outline" size={iconSizes.sm} color={colors.textSubtle} />
      <SizedText size={fontSizes.small} ratio={lineHeights.normal} color={colors.textSubtle} style={styles.text}>
        {t().instagram.rulesNote}
      </SizedText>
    </View>
  );
};

const styles = StyleSheet.create({
  note: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xl },
  text: { flex: ValueConstants.one },
});
