/** Query of `GET /app/campaigns`: the store build's platform and, when the device has one, its ISO region. */
export interface LaunchCampaignsQueryDto {
  platform: string;
  region?: string;
}
