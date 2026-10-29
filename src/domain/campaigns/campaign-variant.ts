/** How a launch campaign is presented: the branded splash behind the launch splash, or a sheet over the feed. */
export const CampaignVariant = {
  Splash: 'splash',
  Dialog: 'dialog',
} as const;

export type CampaignVariantType = (typeof CampaignVariant)[keyof typeof CampaignVariant];
