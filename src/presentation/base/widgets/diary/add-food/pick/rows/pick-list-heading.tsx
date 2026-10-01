import { StyleSheet } from 'react-native';
import { SizedText } from '@presentation/base/widgets/text/sized-text';
import { fontSizes, fontWeights, spacing } from '@presentation/base/theme';
import { upperCase } from '@presentation/i18n/upper-case';

export interface PickListHeadingProps {
  title: string;
}

/** A group title inside the Add food sheet's lists — "SAVED", "MY RECIPES" — in the label style. */
export const PickListHeading = ({ title }: PickListHeadingProps): React.JSX.Element => (
  <SizedText accessibilityRole="header" size={fontSizes.micro} weight={fontWeights.bold} muted style={styles.heading}>
    {upperCase(title)}
  </SizedText>
);

const styles = StyleSheet.create({
  heading: {
    marginTop: spacing.xs2,
    marginBottom: spacing.xxs,
  },
});
