import type { CampaignArtType } from '@domain/campaigns/campaign-art';
import type { CampaignVariantType } from '@domain/campaigns/campaign-variant';

/** A seasonal or promotional moment set in the admin panel, already in this device's language. Read model. */
export interface LaunchCampaign {
  readonly id: string;
  readonly variant: CampaignVariantType;
  readonly art: CampaignArtType;
  /** Gradient top, `#RRGGBB`. */
  readonly colorStart: string;
  /** Gradient bottom, `#RRGGBB`. */
  readonly colorEnd: string;
  readonly imageUrl: string | null;
  readonly title: string;
  readonly body: string;
  readonly ctaLabel: string | null;
  /** An in-app path (`/recipes?tag=…`) or an `https://` URL. */
  readonly ctaLink: string | null;
  readonly startsAtMs: number;
  readonly endsAtMs: number;
  readonly priority: number;
}
