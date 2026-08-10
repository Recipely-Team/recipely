/** The config shape a test records, matching the `request(config)` surface. */
export interface RecordedRequest {
  method?: string;
  url?: string;
  data?: unknown;
  params?: object;
  timeout?: number;
}
