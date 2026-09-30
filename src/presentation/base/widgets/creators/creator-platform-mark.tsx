import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { CreatorPlatform, type CreatorPlatformType } from '@domain/creators/creator-platform';
import { ProvenanceMark, type ProvenanceMarkType } from '@domain/recipes/provenance/provenance-mark';
import { ValueConstants } from '@core/constants';
import { BrandColors, borderWidths } from '@presentation/base/theme';
import { ProvenanceGlyph } from '@presentation/base/widgets/badges/provenance-glyph';
import { creatorMarkGeometry } from '@presentation/base/widgets/creators/creator-mark-geometry';

export interface CreatorPlatformMarkProps {
  platform: CreatorPlatformType;
  /** Diameter of the plate, ring included. */
  size: number;
  /** The colour the mark is cut out of — the surface behind it — drawn as a ring. Omit for no ring. */
  ringColor?: string;
}

/** A platform IS a provenance mark; the creator vocabulary just spells it lower-case. */
const GLYPH_FOR: Record<CreatorPlatformType, ProvenanceMarkType> = {
  [CreatorPlatform.Instagram]: ProvenanceMark.Instagram,
  [CreatorPlatform.TikTok]: ProvenanceMark.TikTok,
};

const INSTAGRAM_PLATE = [
  BrandColors.instagramGradientStart,
  BrandColors.instagramGradientMid,
  BrandColors.instagramGradientEnd,
] as const;
/** The prototype's 45° sweep: yellow at the bottom-left corner, purple at the top-right. */
const SWEEP_START = { x: ValueConstants.zero, y: ValueConstants.one };
const SWEEP_END = { x: ValueConstants.one, y: ValueConstants.zero };

/**
 * The round platform mark on a creator's avatar, chip and claim card.
 *
 * @remarks
 * - **The provenance drawing, on a brand plate.** The glyph is
 *   `ProvenanceGlyph`'s Instagram / TikTok outline in white, so the app draws
 *   each platform once; the plate is Instagram's gradient or TikTok's black.
 * - **Decorative.** The avatar, chip or card it sits on names the platform in
 *   its own label, so the mark is hidden from assistive tech.
 */
export const CreatorPlatformMark = ({ platform, size, ringColor }: CreatorPlatformMarkProps): React.JSX.Element => {
  const ring = ringColor === undefined ? ValueConstants.zero : borderWidths.medium;
  const plate = size - ring * ValueConstants.two;
  const glyph = (
    <ProvenanceGlyph mark={GLYPH_FOR[platform]} size={Math.round(plate * creatorMarkGeometry.glyphShare)} ink={BrandColors.white} />
  );
  const round = { width: plate, height: plate, borderRadius: plate / ValueConstants.two };

  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[
        styles.ring,
        { width: size, height: size, borderRadius: size / ValueConstants.two, borderWidth: ring },
        ringColor === undefined ? null : { borderColor: ringColor },
      ]}
    >
      {platform === CreatorPlatform.Instagram ? (
        <LinearGradient colors={INSTAGRAM_PLATE} start={SWEEP_START} end={SWEEP_END} style={[styles.plate, round]}>
          {glyph}
        </LinearGradient>
      ) : (
        <View style={[styles.plate, round, { backgroundColor: BrandColors.tiktokNote }]}>{glyph}</View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  ring: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  plate: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
