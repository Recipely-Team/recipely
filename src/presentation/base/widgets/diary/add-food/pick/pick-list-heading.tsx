import { StyleSheet } from 'react-native';
import { SizedText } from '@presentation/base/widgets/text/sized-text';
import { fontSizes, fontWeights, spacing } from '@presentation/base/theme';

export interface PickListHeadingProps {
  title: string;
}

/** A group title inside the Add food sheet's lists — "My recipes", "Results". */
export const PickListHeading = ({ title }: PickListHeadingProps): React.JSX.Element => (
  <SizedText accessibilityRole="header" size={fontSizes.caption} weight={fontWeights.bold} muted style={styles.heading}>
    {title}
  </SizedText>
);

const styles = StyleSheet.create({
  heading: {
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
});
