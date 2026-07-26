import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { ThemedText } from '@presentation/base/widgets/text/themed-text';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { spacing, fontSizes, fontWeights, letterSpacings } from '@presentation/base/theme';
import { ValueConstants } from '@core/constants';

export interface WebSectionHeadProps {
  title: string;
  sub?: string;
  /** Trailing controls slot (e.g. difficulty segmented control + sort menu). */
  right?: ReactNode;
}

/** Web-only reusable section heading: h2-role title + optional sub + right slot. */
export const WebSectionHead = ({ title, sub, right }: WebSectionHeadProps): React.JSX.Element => {
  const colors = useTheme().colors;
  return (
    <View style={styles.row}>
      <View style={styles.left}>
        <ThemedText
          accessibilityRole="header"
          style={[styles.title, { color: colors.text }]}
        >
          {title}
        </ThemedText>
        {sub !== undefined ? (
          <ThemedText style={[styles.sub, { color: colors.textMuted }]}>{sub}</ThemedText>
        ) : null}
      </View>
      {right !== undefined ? <View>{right}</View> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  left: {
    flex: ValueConstants.one,
  },
  title: {
    fontWeight: fontWeights.heavy,
    fontSize: fontSizes.display,
    letterSpacing: letterSpacings.tighter,
  },
  sub: {
    fontSize: fontSizes.medium,
    marginTop: spacing.xxs,
  },
});
