import { StyleSheet, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { ValueConstants } from '@core/constants';
import type { ReactNode } from 'react';

export interface CalorieRingProps {
  /** 0–1 of the goal eaten; values past 1 draw a full ring. */
  progress: number;
  /** The arc's ink: `primary`, or the status tone's `solid` once over. */
  color: string;
  size: number;
  stroke: number;
  children: ReactNode;
}

/** The arc starts at 12 o'clock: SVG circles start at 3. */
const START_ROTATION = '-90';

/**
 * The day's calorie ring (design spec → Food Diary §4): a `skeleton` track
 * and a round-capped arc for the share of the goal eaten, with the centre
 * figure passed in as children.
 *
 * @remarks
 * - **No arc at zero.** A round cap on a zero-length dash still paints a dot
 *   at 12 o'clock, which reads as "a little eaten".
 */
export const CalorieRing = ({ progress, color, size, stroke, children }: CalorieRingProps): React.JSX.Element => {
  const colors = useTheme().colors;
  const center = size / ValueConstants.two;
  const radius = (size - stroke) / ValueConstants.two;
  const circumference = ValueConstants.two * Math.PI * radius;
  const shown = Math.min(ValueConstants.one, Math.max(ValueConstants.zero, progress));
  return (
    <View style={[styles.root, { width: size, height: size }]}>
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        <Circle cx={center} cy={center} r={radius} stroke={colors.skeleton} strokeWidth={stroke} fill="none" />
        {shown > ValueConstants.zero ? (
          <Circle
            cx={center}
            cy={center}
            r={radius}
            stroke={color}
            strokeWidth={stroke}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={`${circumference} ${circumference}`}
            strokeDashoffset={circumference * (ValueConstants.one - shown)}
            rotation={START_ROTATION}
            origin={`${center}, ${center}`}
          />
        ) : null}
      </Svg>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  root: { alignItems: 'center', justifyContent: 'center' },
});
