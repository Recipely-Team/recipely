import type { RequestMapper } from '@core/mapper/request-mapper';
import type { LaunchCampaignsQueryDto } from '@infrastructure/campaigns/launch-campaigns-query-dto';

/** The audience being asked about; a device without a region asks without one (it then gets only everywhere-campaigns). */
export const toLaunchCampaignsQuery: RequestMapper<{ platform: string; region: string | null }, LaunchCampaignsQueryDto> = ({
  platform,
  region,
}) => (region === null ? { platform } : { platform, region });
