import { useEffect, useMemo, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { assistantMetrics } from '@presentation/base/widgets/assistant/assistant-metrics';
import { radii } from '@presentation/base/theme';
import { ValueConstants } from '@core/constants';

/** Bars are shortest at the edges and tallest in the middle, as a share of full height. */
const REST_SCALE = 0.08;
const EDGE_SHARE = 0.45;
const CENTRE_SHARE = 0.55;
const REST_OPACITY = 0.28;

export interface AssistantWaveProps {
  level: number;
  active: boolean;
  color: string;
  bars: number;
  height: number;
}

/**
 * The bars that say the microphone is hearing something.
 *
 * @remarks
 * - **One animated value drives every bar.** The level publishes about twelve
 *   times a second; giving each of twenty-six bars its own animation would put
 *   three hundred timers a second on the JS thread, on the screen that is busy
 *   decoding audio.
 * - **It animates `scaleY`, not `height`.** Only transforms run on the native
 *   driver, and the bars are centre-aligned so scaling from the middle grows
 *   them both ways — which is the shape the design asks for anyway.
 * - **Flat means flat.** At rest the bars hold a visible sliver rather than
 *   collapsing: a row that vanishes reads as a broken control, and a row still
 *   twitching after the session ends reads as a live microphone.
 */
export const AssistantWave = ({ level, active, color, bars, height }: AssistantWaveProps): React.JSX.Element => {
  const animated = useRef(new Animated.Value(ValueConstants.zero)).current;

  useEffect(() => {
    Animated.timing(animated, {
      toValue: active ? level : ValueConstants.zero,
      duration: assistantMetrics.levelSettleMs,
      useNativeDriver: true,
    }).start();
  }, [animated, active, level]);

  // Each bar's reach is fixed by its distance from the centre, so the weights
  // are computed once per bar count rather than on every level change.
  const weights = useMemo(
    () =>
      Array.from({ length: bars }, (_, index) => {
        const half = (bars - ValueConstants.one) / ValueConstants.two;
        return ValueConstants.one - Math.abs(index - half) / half;
      }),
    [bars],
  );

  return (
    <View style={[styles.row, { height }]}>
      {weights.map((weight, index) => (
        <Animated.View
          key={index}
          style={[
            styles.bar,
            {
              height,
              backgroundColor: color,
              opacity: active ? EDGE_SHARE + weight * CENTRE_SHARE : REST_OPACITY,
              transform: [
                {
                  scaleY: animated.interpolate({
                    inputRange: [ValueConstants.zero, ValueConstants.one],
                    outputRange: [REST_SCALE, REST_SCALE + (ValueConstants.one - REST_SCALE) * (EDGE_SHARE + weight * CENTRE_SHARE)],
                  }),
                },
              ],
            },
          ]}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: assistantMetrics.waveBarGap },
  // A pinned width and height are right here: this is a shape, not a text box.
  bar: { width: assistantMetrics.waveBarWidth, borderRadius: radii.xs },
});
