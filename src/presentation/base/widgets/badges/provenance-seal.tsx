import { Fragment } from 'react';
import { StyleSheet, View } from 'react-native';
import type { ProvenanceMarkType } from '@domain/recipes/provenance/provenance-mark';
import { ValueConstants } from '@core/constants';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { BrandColors, radii } from '@presentation/base/theme';
import { shadows } from '@presentation/base/theme/tokens/effects/shadows';
import { HoverTooltip } from '@presentation/base/widgets/tooltip/hover-tooltip';
import { ProvenanceGlyph } from '@presentation/base/widgets/badges/provenance-glyph';
import { provenanceLabel } from '@presentation/base/widgets/badges/provenance-label';
import { provenanceSealMetrics as m } from '@presentation/base/widgets/badges/provenance-seal-metrics';
import { SealSurface, type SealSurfaceType } from '@presentation/base/widgets/badges/seal-surface';

export interface ProvenanceSealProps {
  marks: readonly ProvenanceMarkType[];
  surface: SealSurfaceType;
  size: number;
}

/**
 * The white seal that says where a recipe came from — and nothing at all when a
 * person wrote it.
 *
 * @remarks
 * - **Nothing for an empty list, before anything else is read.** Most recipes
 *   are hand-written, and a marker on every one of them is noise.
 * - **Two marks are one capsule, not two seals.** An import a model wrote
 *   carries the platform and the AI mark side by side, split by a hairline: two
 *   seals would put three objects in a corner the cuisine tag already shares.
 * - **White face, dark ring, on a photo of any brightness.** The face is 21:1
 *   against a black pixel and the ring 5.1:1 against a white one, so the seal
 *   never depends on what the photo happens to be.
 * - **One accessible name for the whole capsule**, carried by `HoverTooltip`,
 *   which on web shows the same phrase as a bubble — on a card the seal is the
 *   only place the fact lives.
 */
export const ProvenanceSeal = ({ marks, surface, size }: ProvenanceSealProps): React.JSX.Element | null => {
  const colors = useTheme().colors;
  if (marks.length === ValueConstants.zero) return null;

  const onPhoto = surface === SealSurface.Photo;
  const glyph = Math.round(size * (onPhoto ? m.glyphShareOnPhoto : m.glyphShareOnPage));
  const pair = marks.length > ValueConstants.one;
  const label = provenanceLabel(marks);

  return (
    <HoverTooltip label={label} accessibilityLabel={label}>
      <View
        style={[
          styles.seal,
          onPhoto ? shadows.md : shadows.sm,
          {
            height: size,
            minWidth: size,
            gap: Math.round(size * m.gapShare),
            paddingHorizontal: pair ? Math.round(size * m.pairPaddingShare) : ValueConstants.zero,
            borderWidth: onPhoto ? m.ringOnPhoto : m.ringOnPage,
            borderColor: onPhoto ? BrandColors.sealRing : colors.cardBorder,
          },
        ]}
      >
        {marks.map((mark, i) => (
          <Fragment key={mark}>
            {i > ValueConstants.zero ? (
              <View style={[styles.divider, { height: Math.round(size * m.dividerHeightShare) }]} />
            ) : null}
            <ProvenanceGlyph mark={mark} size={glyph} />
          </Fragment>
        ))}
      </View>
    </HoverTooltip>
  );
};

const styles = StyleSheet.create({
  seal: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
    borderRadius: radii.round,
    backgroundColor: BrandColors.white,
  },
  divider: {
    width: m.divider,
    backgroundColor: BrandColors.sealDivider,
  },
});
