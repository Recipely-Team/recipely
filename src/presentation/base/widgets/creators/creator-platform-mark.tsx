import { StyleSheet, View } from 'react-native';
import { CreatorPlatform, type CreatorPlatformType } from '@domain/creators/creator-platform';
import { ProvenanceMark, type ProvenanceMarkType } from '@domain/recipes/provenance/provenance-mark';
import { ValueConstants } from '@core/constants';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { borderWidths, BrandColors } from '@presentation/base/theme';
import { ProvenanceGlyph } from '@presentation/base/widgets/badges/provenance-glyph';
import { creatorMarkGeometry } from '@presentation/base/widgets/creators/creator-mark-geometry';

export interface CreatorPlatformMarkProps {
  platform: CreatorPlatformType;
  /** Diameter of the seal, halo excluded. */
  size: number;
  /** The colour the seal is cut out of — the surface behind it — drawn as a 2px halo outside it. Omit for none. */
  haloColor?: string;
}

/** A platform IS a provenance mark; the creator vocabulary just spells it lower-case. */
const GLYPH_FOR: Record<CreatorPlatformType, ProvenanceMarkType> = {
  [CreatorPlatform.Instagram]: ProvenanceMark.Instagram,
  [CreatorPlatform.TikTok]: ProvenanceMark.TikTok,
};

/**
 * The round platform seal on a creator's avatar, badge, chip and claim form.
 *
 * @remarks
 * - **The provenance seal, on the page.** White face, a `cardBorder` hairline
 *   and the platform's outline in its own inks — the same capsule a recipe
 *   card wears for an import, so the app draws one source mark everywhere
 *   (design spec → Creators §3).
 * - **The halo** separates the seal from an avatar photo: a ring in the colour
 *   of the ground it sits on, outside the seal's own size.
 * - **Decorative.** The avatar, chip or option it sits on names the platform in
 *   its own label, so the seal is hidden from assistive tech.
 */
export const CreatorPlatformMark = ({ platform, size, haloColor }: CreatorPlatformMarkProps): React.JSX.Element => {
  const colors = useTheme().colors;
  const halo = haloColor === undefined ? ValueConstants.zero : borderWidths.medium;
  const outer = size + halo * ValueConstants.two;

  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[
        styles.centre,
        { width: outer, height: outer, borderRadius: outer / ValueConstants.two, borderWidth: halo },
        haloColor === undefined ? null : { borderColor: haloColor, backgroundColor: haloColor },
      ]}
    >
      <View
        style={[
          styles.centre,
          styles.face,
          { width: size, height: size, borderRadius: size / ValueConstants.two, borderColor: colors.cardBorder },
        ]}
      >
        <ProvenanceGlyph mark={GLYPH_FOR[platform]} size={Math.round(size * creatorMarkGeometry.glyphShare)} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  centre: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  face: {
    backgroundColor: BrandColors.white,
    borderWidth: borderWidths.hairline,
  },
});
