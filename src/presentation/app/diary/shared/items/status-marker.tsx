import Svg, { Circle, Path } from 'react-native-svg';
import { StatusMarkerKind, type StatusMarkerKindType } from '@presentation/app/diary/shared/model/status-marker-kind';

export interface StatusMarkerProps {
  kind: StatusMarkerKindType;
  color: string;
  /** Box edge; `diarySizes.marker` in cells, `markerStrip` in the status strip. */
  size: number;
}

/** Drawn on a 10-unit grid and scaled to `size`, so the four shapes stay the same weight at any size. */
const VIEW_BOX = '0 0 10 10';
const STROKE = 1.6;
const CENTER = 5;
const RADIUS = 3.7;
const CHECK = 'M1.8 5.3 L4.1 7.5 L8.3 2.6';
const TRIANGLE = 'M5 1.3 L9 8.7 L1 8.7 Z';
const DOUBLE_CHEVRON = 'M1.8 5.2 L5 2 L8.2 5.2 M1.8 8.6 L5 5.4 L8.2 8.6';

/**
 * The shape that goes with a status — hollow circle, check, filled triangle,
 * double chevron — so the diary never tells a status by colour alone
 * (design spec → Food Diary §2.1). Decorative: the cell's label speaks it.
 */
export const StatusMarker = ({ kind, color, size }: StatusMarkerProps): React.JSX.Element => (
  <Svg width={size} height={size} viewBox={VIEW_BOX} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
    {kind === StatusMarkerKind.HollowCircle ? (
      <Circle cx={CENTER} cy={CENTER} r={RADIUS} stroke={color} strokeWidth={STROKE} fill="none" />
    ) : null}
    {kind === StatusMarkerKind.Check ? (
      <Path d={CHECK} stroke={color} strokeWidth={STROKE} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    ) : null}
    {kind === StatusMarkerKind.Triangle ? <Path d={TRIANGLE} fill={color} strokeLinejoin="round" /> : null}
    {kind === StatusMarkerKind.DoubleChevron ? (
      <Path d={DOUBLE_CHEVRON} stroke={color} strokeWidth={STROKE} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    ) : null}
  </Svg>
);
