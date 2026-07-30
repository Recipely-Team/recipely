import { StyleSheet, View } from 'react-native';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { spacing, borderWidths } from '@presentation/base/theme';
import { ThemedText } from '@presentation/base/widgets/text/themed-text';
import { ValueConstants } from '@core/constants';

export interface SectionHeaderProps {
  title: string;
  /**
   * How many items the section holds, shown at the far end of the rule.
   *
   * A prop rather than something the caller concatenates into `title`: glued on
   * as "Malzemeler · 8" the number read as part of the heading and sat in the
   * middle of an otherwise empty line, while the same count on the recipe
   * editor is right-aligned at the end of its row. Same information, two
   * placements, one screen apart.
   */
  count?: number;
}

export const SectionHeader = ({ title, count }: SectionHeaderProps): React.JSX.Element => {
  const colors = useTheme().colors;

  return (
    <View style={styles.container}>
      <ThemedText variant="label" muted>{title}</ThemedText>
      <View style={[styles.line, { backgroundColor: colors.border }]} />
      {count !== undefined ? (
        <ThemedText variant="label" muted style={styles.count}>
          {count}
        </ThemedText>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xl,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  line: {
    flex: ValueConstants.one,
    height: borderWidths.hairline,
    marginLeft: spacing.md,
  },
  count: {
    marginLeft: spacing.md,
  },
});
