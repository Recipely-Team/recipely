import { useCallback, useEffect, useRef } from 'react';
import { Animated, Easing, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { alarmStore } from '@application/timers/alarm-store';
import { stopTimer } from '@presentation/base/timers/timer-controls';
import { getAlarmAudioService } from '@application/audio/get-alarm-audio-service';
import { ThemedText } from '@presentation/base/widgets/text/themed-text';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import {
  spacing,
  radii,
  fontWeights,
  lineHeights,
  lineHeightFor,
  controlSizes,
  mediaSizes,
} from '@presentation/base/theme';
import { t } from '@presentation/i18n';
import { ValueConstants } from '@core/constants';

export interface AlarmScreenProps {
  timerId: string;
  recipeName: string;
}

const PULSE_DURATION = 600;
// Haptic fires every 1.5 s so the phone buzzes repeatedly while the alarm
// overlay is visible — useful when the device is on silent mode.
const HAPTIC_INTERVAL_MS = 1500;

export const AlarmScreen = ({ timerId, recipeName }: AlarmScreenProps): React.JSX.Element => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Pulse animation
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(scale, {
          toValue: 1.2,
          duration: PULSE_DURATION,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 1,
          duration: PULSE_DURATION,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );
    pulse.start();

    // Looping alarm tone — bypasses silent switch on iOS.
    void getAlarmAudioService().start();

    // Repeating haptic so the phone buzzes even when on silent mode. An
    // interval rather than a self-scheduling async loop: the loop could only be
    // asked to stop and then had to wait out its own sleep, so it kept buzzing
    // (and held a live timer) past the dismiss that was meant to end it.
    const buzz = (): void => {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    };
    buzz();
    const buzzInterval = setInterval(buzz, HAPTIC_INTERVAL_MS);

    return () => {
      pulse.stop();
      clearInterval(buzzInterval);
      void getAlarmAudioService().stop();
    };
  }, [scale]);

  const dismiss = useCallback(() => {
    void getAlarmAudioService().stop();
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    void stopTimer(timerId);
    alarmStore.getState().dismiss();
  }, [timerId]);

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.background,
          paddingTop: insets.top + spacing.xl,
          paddingBottom: insets.bottom + spacing.xl,
        },
      ]}
    >
      <View style={styles.content}>
        <Animated.Text
          accessibilityElementsHidden
          importantForAccessibility="no"
          style={[styles.bell, { transform: [{ scale }] }]}
        >
          ⏰
        </Animated.Text>

        <ThemedText variant="headline" style={styles.centered}>
          {t().alarm.title}
        </ThemedText>
        <ThemedText variant="subtitle" style={[styles.centered, { color: colors.primary }]}>
          {recipeName}
        </ThemedText>
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t().alarm.dismiss}
        onPress={dismiss}
        style={[styles.dismissBtn, { backgroundColor: colors.primary }]}
      >
        <ThemedText variant="subtitle" style={[styles.dismissLabel, { color: colors.primaryText }]}>
          {t().alarm.dismiss}
        </ThemedText>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: ValueConstants.one,
    paddingHorizontal: spacing.xl,
  },
  // One centred block instead of `space-between` on the whole screen: with
  // three loose children the bell was pinned to the top edge and the labels
  // floated in the middle of an otherwise empty screen.
  content: {
    flex: ValueConstants.one,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  bell: {
    fontSize: mediaSizes.heroSquare,
    // An emoji is still text: without a line box sized to it the glyph is
    // clipped to the platform default line height.
    lineHeight: lineHeightFor(mediaSizes.heroSquare, lineHeights.snug),
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  centered: {
    textAlign: 'center',
  },
  dismissLabel: {
    textAlign: 'center',
    fontWeight: fontWeights.bold,
  },
  dismissBtn: {
    minHeight: controlSizes.button,
    borderRadius: radii.xxl,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
});
