/** The vector decoration drawn over a campaign's gradient — shipped in the app, never downloaded. */
export const CampaignArt = {
  None: 'none',
  Crescent: 'crescent',
  Snow: 'snow',
  Sun: 'sun',
} as const;

export type CampaignArtType = (typeof CampaignArt)[keyof typeof CampaignArt];
