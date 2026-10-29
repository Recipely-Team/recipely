import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, Mask, Path, Rect } from 'react-native-svg';
import type { CampaignArtType } from '@domain/campaigns/campaign-art';
import { CharConstants, ValueConstants } from '@core/constants';
import { BrandColors} from '@presentation/base/theme';
import { campaignSizes } from '@presentation/base/widgets/launch-campaign/launch-campaign-sizes';
import { ART_LAYOUTS, ART_VIEW_BOX, CampaignArtFrame, CRESCENT_CUT as CUT, STAR_ARMS as STAR, type CampaignArtFrameType } from '@presentation/base/widgets/launch-campaign/launch-campaign-geometry';

const CRESCENT_MASK_ID = 'campaign-crescent-cut';

const starPath = (x: number, y: number, size: number): string => {
  const long = STAR.long * size;
  const short = STAR.short * size;
  return [
    `M${x} ${y - long}`, `L${x + short} ${y - short}`, `L${x + long} ${y}`, `L${x + short} ${y + short}`,
    `L${x} ${y + long}`, `L${x - short} ${y + short}`, `L${x - long} ${y}`, `L${x - short} ${y - short}`, 'Z',
  ].join(CharConstants.space);
};

export interface CampaignArtLayerProps {
  art: CampaignArtType;
  frame: CampaignArtFrameType;
}

/** The seasonal decoration over a campaign gradient. Decorative: hidden from screen readers, takes no touches. */
export const CampaignArtLayer = ({ art, frame }: CampaignArtLayerProps): React.JSX.Element => {
  const layout = ART_LAYOUTS[art][frame];
  const crescent = layout.crescent;
  const [crescentX, crescentY, crescentR] = crescent ?? [ValueConstants.zero, ValueConstants.zero, ValueConstants.zero];
  return (
    <View style={[StyleSheet.absoluteFill, styles.column]} pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
    <Svg style={frame === CampaignArtFrame.Splash ? styles.splash : StyleSheet.absoluteFill} viewBox={ART_VIEW_BOX[frame]} preserveAspectRatio="xMidYMid slice">
      {crescent !== undefined ? (
        <>
          <Defs>
            <Mask id={CRESCENT_MASK_ID}>
              <Rect width="100%" height="100%" fill={BrandColors.white} />
              <Circle cx={crescentX + CUT.dx * crescentR} cy={crescentY + CUT.dy * crescentR} r={CUT.r * crescentR} fill={BrandColors.black} />
            </Mask>
          </Defs>
          <Circle cx={crescentX} cy={crescentY} r={crescentR} fill={BrandColors.campaignCrescent} mask={`url(#${CRESCENT_MASK_ID})`} />
        </>
      ) : null}
      {(layout.stars ?? []).map(([x, y, size, opacity]) => (
        <Path key={`s${x}-${y}`} d={starPath(x, y, size)} fill={BrandColors.white} opacity={opacity} />
      ))}
      {(layout.dots ?? []).map(([x, y, size, opacity]) => (
        <Circle key={`d${x}-${y}`} cx={x} cy={y} r={size} fill={BrandColors.white} opacity={opacity} />
      ))}
      {(layout.rings ?? []).map(([x, y, size, opacity]) => (
        <Circle key={`r${size}`} cx={x} cy={y} r={size} fill="none" stroke={BrandColors.white} strokeWidth={campaignSizes.ringStroke} opacity={opacity} />
      ))}
    </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  column: { alignItems: 'center' },
  splash: { width: '100%', height: '100%', maxWidth: campaignSizes.splashArtMaxWidth },
});
