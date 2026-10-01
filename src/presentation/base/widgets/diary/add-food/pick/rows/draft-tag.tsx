import { StyleSheet, View } from 'react-native';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { SizedText } from '@presentation/base/widgets/text/sized-text';
import { borderWidths, diarySizes, fontSizes, fontWeights, spacing } from '@presentation/base/theme';
import { ValueConstants } from '@core/constants';

export interface DraftTagProps {
  label: string;
}

/** "Draft" after an own unpublished recipe's name — text, so the meaning never rests on colour alone. */
export const DraftTag = ({ label }: DraftTagProps): React.JSX.Element => {
  const colors = useTheme().colors;
  return (
    <View style={[styles.tag, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <SizedText size={fontSizes.tiny} weight={fontWeights.bold} muted numberOfLines={ValueConstants.one}>
        {label}
      </SizedText>
    </View>
  );
};

const styles = StyleSheet.create({
  tag: {
    minHeight: diarySizes.draftTagMinHeight,
    paddingHorizontal: spacing.xs2,
    borderRadius: diarySizes.draftTagRadius,
    borderWidth: borderWidths.hairline,
    justifyContent: 'center',
  },
});
