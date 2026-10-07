import { StyleSheet, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { BrandColors, borderWidths, controlSizes, iconSizes, radii } from '@presentation/base/theme';

export interface TickBoxProps {
  checked: boolean;
}

/**
 * **TickBox** — the app's one tick: a rounded square, success-filled with a
 * check when ticked, a plain outline when not.
 *
 * @remarks
 * - Drawing only: the row around it is the `Pressable` (role `checkbox`), so the
 *   whole row is the tap target and carries the accessibility state.
 * - Recipe ingredients, the shopping list and the meal-photo candidates all use it.
 */
export const TickBox = ({ checked }: TickBoxProps): React.JSX.Element => {
  const colors = useTheme().colors;
  return (
    <View
      style={[
        styles.box,
        checked
          ? { backgroundColor: colors.success, borderColor: colors.success }
          : { backgroundColor: BrandColors.transparent, borderColor: colors.border },
      ]}
    >
      {checked ? <Ionicons name="checkmark" size={iconSizes.sm} color={colors.onSuccess} /> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  box: {
    width: controlSizes.checkbox,
    height: controlSizes.checkbox,
    borderRadius: radii.sm,
    borderWidth: borderWidths.medium,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
