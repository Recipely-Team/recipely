import { Pressable, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { FridgeAvailability } from '@application/fridge/fridge-availability';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { useFridgeAvailability } from '@presentation/base/hooks/recipes/use-fridge-availability';
import { RoutePaths } from '@presentation/base/constants';
import { borderWidths, fridgeSizes, iconSizes, opacities, radii } from '@presentation/base/theme';
import { t } from '@presentation/i18n';
import { ValueConstants } from '@core/constants';

/**
 * The camera shortcut beside the phone's AI banner (design spec → Cook from
 * my fridge, Route & entry points): 50 wide, the banner's gradient, radius lg,
 * stretched to the banner's height. Nothing while `fridgeToRecipe` is off.
 */
export const FridgeCameraButton = (): React.JSX.Element | null => {
  const colors = useTheme().colors;
  const router = useRouter();
  const availability = useFridgeAvailability();
  if (availability !== FridgeAvailability.On) return null;
  return (
    <Pressable
      onPress={() => router.push(RoutePaths.fridge)}
      accessibilityRole="button"
      accessibilityLabel={t().fridge.bannerA11y}
      style={({ pressed }) => [styles.button, { opacity: pressed ? opacities.pressedSubtle : opacities.full }]}
    >
      <LinearGradient
        colors={[colors.primaryGradientStart, colors.primaryGradientEnd]}
        start={{ x: ValueConstants.zero, y: ValueConstants.zero }}
        end={{ x: ValueConstants.one, y: ValueConstants.one }}
        style={[styles.fill, { borderColor: colors.primary }]}
      >
        <Ionicons name="camera-outline" size={iconSizes.lg} color={colors.onOverlay} />
      </LinearGradient>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: { width: fridgeSizes.bannerCamera, alignSelf: 'stretch' },
  fill: {
    flex: ValueConstants.one,
    borderRadius: radii.lg,
    borderWidth: borderWidths.hairline,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
