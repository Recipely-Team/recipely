interface FunnelDto {
  matched: number;
  sent: number;
  opened: number;
  saved: number;
}

// `GET /me/instagram/stats?days=7|30|90` (backend #390).
export interface CreatorStatsDto {
  days: number;
  from: string;
  to: string;
  connected: boolean;
  totals: FunnelDto;
  previous: FunnelDto;
  daily: (FunnelDto & { day: string })[];
  followers: {
    current: number | null;
    change: number | null;
    trackingSince: string | null;
    points: { day: string; followers: number }[];
  };
  posts: (FunnelDto & {
    ruleId: string;
    mediaId: string;
    thumbnailUrl: string | null;
    permalink: string | null;
    keywords: string[];
    enabled: boolean;
  })[];
}
