import { useId } from 'react';
import Svg, { Circle, Defs, G, LinearGradient, Path, Rect, Stop } from 'react-native-svg';
import { ProvenanceMark, type ProvenanceMarkType } from '@domain/recipes/provenance/provenance-mark';
import { BrandColors } from '@presentation/base/theme';

export interface ProvenanceGlyphProps {
  mark: ProvenanceMarkType;
  size: number;
}

const VIEW_BOX = '0 0 24 24';
const STROKE = 2.3;
const TIKTOK_NOTE = 'M10.2 10.9a3.3 3.3 0 1 0 3.3 3.3V3c.4 2.4 2.3 4.2 4.8 4.5';
const TIKTOK_OFFSET = 'translate(-0.6 1.6)';
const TIKTOK_CYAN_ECHO = 'translate(-0.9 -0.9)';
const TIKTOK_RED_ECHO = 'translate(0.9 0.9)';
const SPARKLE_LARGE =
  'M11 3.5c.5 3.9 2.6 6 6.5 6.5-3.9.5-6 2.6-6.5 6.5-.5-3.9-2.6-6-6.5-6.5 3.9-.5 6-2.6 6.5-6.5Z';
const SPARKLE_SMALL =
  'M18.5 14.5c.25 1.9 1.1 2.75 3 3-1.9.25-2.75 1.1-3 3-.25-1.9-1.1-2.75-3-3 1.9-.25 2.75-1.1 3-3Z';

const INSTAGRAM_STOPS = [
  { offset: '0', color: BrandColors.instagramInkOrange },
  { offset: '0.4', color: BrandColors.instagramInkPink },
  { offset: '0.7', color: BrandColors.instagramInkMagenta },
  { offset: '1', color: BrandColors.instagramInkPurple },
] as const;
const AI_STOPS = [
  { offset: '0', color: BrandColors.aiInkIndigo },
  { offset: '1', color: BrandColors.aiInkTeal },
] as const;

/**
 * One mark on the provenance seal, drawn for the seal's white face.
 *
 * @remarks
 * - **Outlines in the platform's own colours, never its gradient plate.** The
 *   seal is a passive fact about the recipe, not the import card's call to
 *   action, and every ink here is at least 3:1 on white.
 * - **A gradient id per instance.** SVG ids are document-global on web, so two
 *   seals sharing one id would both paint with whichever gradient came last.
 */
export const ProvenanceGlyph = ({ mark, size }: ProvenanceGlyphProps): React.JSX.Element => {
  const inkId = `provenance-ink-${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const ink = `url(#${inkId})`;

  if (mark === ProvenanceMark.TikTok) {
    const note = { d: TIKTOK_NOTE, fill: 'none', strokeWidth: STROKE, strokeLinecap: 'round', strokeLinejoin: 'round' } as const;
    return (
      <Svg width={size} height={size} viewBox={VIEW_BOX}>
        <G transform={TIKTOK_OFFSET}>
          <Path {...note} stroke={BrandColors.tiktokCyan} transform={TIKTOK_CYAN_ECHO} />
          <Path {...note} stroke={BrandColors.tiktokRed} transform={TIKTOK_RED_ECHO} />
          <Path {...note} stroke={BrandColors.tiktokNote} />
        </G>
      </Svg>
    );
  }

  const stops = mark === ProvenanceMark.Ai ? AI_STOPS : INSTAGRAM_STOPS;
  return (
    <Svg width={size} height={size} viewBox={VIEW_BOX}>
      <Defs>
        <LinearGradient id={inkId} gradientUnits="userSpaceOnUse" x1="3" y1="21" x2="21" y2="3">
          {stops.map((s) => (
            <Stop key={s.offset} offset={s.offset} stopColor={s.color} />
          ))}
        </LinearGradient>
      </Defs>
      {mark === ProvenanceMark.Ai ? (
        <>
          <Path d={SPARKLE_LARGE} fill={ink} />
          <Path d={SPARKLE_SMALL} fill={ink} />
        </>
      ) : (
        <>
          <Rect x="3.2" y="3.2" width="17.6" height="17.6" rx="5.2" fill="none" stroke={ink} strokeWidth={STROKE} />
          <Circle cx="12" cy="12" r="4" fill="none" stroke={ink} strokeWidth={STROKE} />
          <Circle cx="17.1" cy="6.9" r="1.35" fill={ink} />
        </>
      )}
    </Svg>
  );
};
