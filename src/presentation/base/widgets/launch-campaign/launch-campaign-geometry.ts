import { CampaignArt, type CampaignArtType } from '@domain/campaigns/campaign-art';

/** `[x, y, size, opacity]` in the frame's viewBox. */
type Mark = readonly [number, number, number, number];

interface ArtLayout {
  readonly crescent?: readonly [number, number, number];
  readonly stars?: readonly Mark[];
  readonly dots?: readonly Mark[];
  readonly rings?: readonly Mark[];
}

/** The two frames the art is drawn in: the full-screen splash and the dialog's hero band. */
export const CampaignArtFrame = {
  Splash: 'splash',
  Hero: 'hero',
} as const;

export type CampaignArtFrameType = (typeof CampaignArtFrame)[keyof typeof CampaignArtFrame];

/** viewBox per frame, drawn with `xMidYMid slice` so the art fills any screen. */
export const ART_VIEW_BOX: Record<CampaignArtFrameType, string> = {
  [CampaignArtFrame.Splash]: '0 0 390 844',
  [CampaignArtFrame.Hero]: '0 0 400 168',
};

/**
 * Every art preset's marks, copied from the Claude Design board "Board · Launch Campaign"
 * (`src/launch-campaign.jsx`): crescent and stars for Ramadan, snow for winter, sun rings for summer.
 */
export const ART_LAYOUTS: Record<CampaignArtType, Record<CampaignArtFrameType, ArtLayout>> = {
  [CampaignArt.None]: { [CampaignArtFrame.Splash]: {}, [CampaignArtFrame.Hero]: {} },
  [CampaignArt.Crescent]: {
    [CampaignArtFrame.Splash]: {
      crescent: [195, 150, 46],
      stars: [[70, 90, 7, 0.9], [318, 120, 9, 0.8], [110, 250, 5, 0.7], [300, 270, 6, 0.8], [60, 640, 6, 0.6], [330, 600, 7, 0.5]],
      dots: [[40, 200, 2.5, 0.6], [352, 220, 2.5, 0.6], [150, 60, 2, 0.6], [250, 70, 2.5, 0.5], [200, 700, 2, 0.5]],
    },
    [CampaignArtFrame.Hero]: {
      crescent: [200, 70, 30],
      stars: [[70, 40, 6, 0.9], [330, 50, 7, 0.8], [40, 120, 4, 0.6]],
      dots: [[120, 110, 2, 0.6], [290, 120, 2.5, 0.6]],
    },
  },
  [CampaignArt.Snow]: {
    [CampaignArtFrame.Splash]: {
      dots: [
        [40, 80, 4, 0.7], [120, 40, 3, 0.6], [220, 110, 5, 0.6], [330, 60, 4, 0.7],
        [360, 180, 3, 0.5], [70, 220, 3, 0.5], [290, 260, 4, 0.5], [180, 300, 2.5, 0.5],
        [30, 400, 3, 0.4], [365, 430, 4, 0.4], [60, 620, 5, 0.5], [330, 660, 4, 0.5],
        [200, 720, 3, 0.5], [120, 760, 4, 0.4], [290, 770, 3, 0.5],
      ],
    },
    [CampaignArtFrame.Hero]: {
      dots: [[40, 30, 4, 0.7], [120, 90, 3, 0.6], [200, 25, 5, 0.6], [280, 80, 4, 0.7], [350, 35, 3, 0.6], [90, 130, 3, 0.5], [320, 125, 4, 0.5]],
    },
  },
  [CampaignArt.Sun]: {
    [CampaignArtFrame.Splash]: {
      rings: [[320, 120, 150, 0.22], [320, 120, 100, 0.28], [320, 120, 56, 0.4]],
      dots: [[60, 600, 40, 0.1], [340, 680, 60, 0.1], [90, 240, 3, 0.5], [180, 80, 3, 0.5], [40, 340, 2.5, 0.4]],
    },
    [CampaignArtFrame.Hero]: {
      rings: [[330, 40, 90, 0.22], [330, 40, 60, 0.3], [330, 40, 34, 0.45]],
      dots: [[60, 120, 3, 0.5], [150, 40, 2.5, 0.5]],
    },
  },
};

/** Gradient direction from the board's ~165° CSS angle: top a little left → bottom a little right. */
export const CAMPAIGN_GRADIENT = { start: { x: 0.37, y: 0.02 }, end: { x: 0.63, y: 0.98 } } as const;

/** The board's "rise" curve (`cubic-bezier(0.2, 0.9, 0.25, 1)`): a quick start that settles softly. */
export const RISE_BEZIER = [0.2, 0.9, 0.25, 1] as const;

/** The splash's stagger: tile, then title, then subtitle (ms). */
export const RISE_DELAYS = { tile: 120, title: 220, subtitle: 300 } as const;

/** The crescent's cut-out circle, as shares of its radius (offset x, offset y, radius). */
export const CRESCENT_CUT = { dx: 0.45, dy: -0.25, r: 0.82 } as const;

/** A four-point star's long and short arms, as shares of its size. */
export const STAR_ARMS = { long: 1.5, short: 0.4 } as const;

/** The dialog body's line cap. */
export const DIALOG_BODY_LINES = 2;
