import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@presentation/base/widgets/text/themed-text';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { spacing, iconSizes } from '@presentation/base/theme';
import { ValueConstants } from '@core/constants';

export interface FieldErrorTextProps {
  message: string;
}

/** Small red warning icon + message shown under an invalid form field. */
export const FieldErrorText = ({ message }: FieldErrorTextProps): React.JSX.Element => {
  const colors = useTheme().colors;
  return (
    <View style={styles.root}>
      <Ionicons name="alert-circle" size={iconSizes.lg} color={colors.danger} />
      <ThemedText variant="caption" style={[styles.message, { color: colors.danger }]}>
        {message}
      </ThemedText>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs2,
    marginTop: spacing.xs2,
  },
  message: {
    flex: ValueConstants.one,
  },
});
